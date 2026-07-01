import { createHash } from 'crypto';

/**
 * Núcleo de notificação para o Telegram.
 *
 * Porta o padrão do projeto de referência (mvp-drafto) para o NestJS:
 * - roteia por severidade em tópicos (threads) do grupo de fórum;
 * - formata mensagens ricas em HTML (ambiente, endpoint, exceção, contexto);
 * - faz throttle por assinatura para evitar flood do mesmo erro;
 * - filtra ruído de varredura de bots (404 em /wp-admin, /.env, etc.);
 * - NUNCA lança: se o Telegram falhar, apenas registra no console.
 *
 * É um singleton simples (sem DI) para poder ser usado tanto pelos providers
 * do Nest quanto pelo logger customizado, que é criado antes do container.
 * A configuração é lida de `process.env` sob demanda (funciona com o .env local
 * carregado pelo ConfigModule e com as variáveis injetadas pelo container).
 */

export type TelegramLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical' | 'fatal';

/** Canais lógicos → mapeados para tópicos (threads) do grupo. */
export type TelegramChannel = 'alerts' | 'support' | 'debug';

export interface TelegramNotifyOptions {
  /** Canal explícito; se omitido, é derivado do nível. */
  channel?: TelegramChannel;
  /** Contexto adicional serializado como JSON na mensagem. */
  context?: Record<string, unknown>;
  /** Erro associado (extrai classe, arquivo e linha do stack). */
  error?: unknown;
  /** Contexto HTTP quando o alerta vem de uma requisição. */
  http?: HttpContext;
  /** Assinatura para throttle; se omitida, é derivada de nível + título. */
  signature?: string;
  /** Ignora o throttle (ex.: eventos de sistema como start/stop). */
  bypassThrottle?: boolean;
}

export interface HttpContext {
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  status?: number;
  body?: unknown;
}

const LEVEL_EMOJI: Record<TelegramLevel, string> = {
  debug: '🔍',
  info: 'ℹ️',
  warning: '⚠️',
  error: '🚨',
  critical: '🔥',
  fatal: '🆘',
};

/** Campos que nunca devem ir para o Telegram. */
const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'imageBase64',
  'creditCard',
];

/**
 * Trechos de path típicos de varredura automatizada (WordPress, .env, phpMyAdmin,
 * probes de RCE). 404s nesses caminhos são ruído de fundo da internet — não geram
 * alerta (mas seguem no log/console).
 */
const SCANNER_NOISE = [
  'wp-',
  'wordpress',
  'xmlrpc.php',
  'wlwmanifest',
  '.env',
  '.git',
  '.svn',
  '.htaccess',
  '.aws/',
  'phpmyadmin',
  'phpinfo',
  'myadmin',
  'mysqladmin',
  '/pma',
  'vendor/phpunit',
  'eval-stdin.php',
  'cgi-bin',
  'autodiscover',
  '.aspx',
  '.asp',
  '.jsp',
  '.cgi',
  'boaform',
  'setup.cgi',
  'hnap1',
  'solr/',
  'actuator',
  'jenkins',
  '.sql',
  '.bak',
  '.old',
  'owa/',
  'ecp/',
];

const TELEGRAM_MAX_LEN = 4096;
const THROTTLE_MS = 5 * 60 * 1000; // 5 min por assinatura

class TelegramNotifier {
  /** assinatura → timestamp de expiração (ms). */
  private readonly throttle = new Map<string, number>();

  get token(): string {
    return process.env.TELEGRAM_BOT_TOKEN ?? '';
  }

  get chatId(): string {
    return process.env.TELEGRAM_CHAT_ID ?? '';
  }

  get enabled(): boolean {
    return this.token.length > 0 && this.chatId.length > 0;
  }

  private threadFor(channel: TelegramChannel): string | undefined {
    const map: Record<TelegramChannel, string | undefined> = {
      alerts: process.env.TELEGRAM_THREAD_ALERTS,
      support: process.env.TELEGRAM_THREAD_SUPPORT,
      debug: process.env.TELEGRAM_THREAD_DEBUG,
    };
    const value = map[channel];
    return value && /^\d+$/.test(value) ? value : undefined;
  }

  private channelForLevel(level: TelegramLevel): TelegramChannel {
    switch (level) {
      case 'error':
      case 'critical':
      case 'fatal':
        return 'alerts';
      case 'debug':
        return 'debug';
      default:
        return 'support';
    }
  }

  /**
   * Envia uma notificação já roteada e com throttle.
   * Retorna false silenciosamente se o Telegram não estiver configurado.
   */
  async notify(
    level: TelegramLevel,
    title: string,
    message: string,
    options: TelegramNotifyOptions = {},
  ): Promise<boolean> {
    if (!this.enabled) return false;

    const signature = options.signature ?? `${level}|${title}|${message.slice(0, 120)}`;
    if (!options.bypassThrottle && !this.shouldSend(signature)) return false;

    const channel = options.channel ?? this.channelForLevel(level);
    const text = this.format(level, title, message, options);
    return this.post(text, this.threadFor(channel));
  }

  /**
   * Reporta uma exceção vinda de uma requisição HTTP, roteando por status:
   * 5xx → alerts | 404 → debug | demais 4xx → support.
   * Ignora 404 de varredura de bots.
   */
  async reportHttpException(error: unknown, http: HttpContext): Promise<boolean> {
    if (!this.enabled) return false;

    const status = http.status ?? 500;
    if (status === 404 && this.isScannerNoise(http.url)) return false;

    let level: TelegramLevel;
    let channel: TelegramChannel;
    if (status >= 500) {
      level = 'critical';
      channel = 'alerts';
    } else if (status === 404) {
      level = 'debug';
      channel = 'debug';
    } else {
      level = 'warning';
      channel = 'support';
    }

    const name = error instanceof Error ? error.constructor.name : 'Erro';
    const path = this.pathOf(http.url);
    const signature = `${status}|${name}|${path}`;
    const message = error instanceof Error ? error.message : String(error ?? 'Erro');

    return this.notify(level, `Erro ${status}`, message, {
      channel,
      error,
      http,
      signature,
    });
  }

  /** Aviso intencional da aplicação (ex.: regra de negócio suspeita). */
  warning(title: string, message: string, context?: Record<string, unknown>): Promise<boolean> {
    return this.notify('warning', title, message, { context });
  }

  /** Evento de sistema (start/stop/heartbeat) — sem throttle. */
  system(
    level: TelegramLevel,
    title: string,
    message: string,
    context?: Record<string, unknown>,
  ): Promise<boolean> {
    return this.notify(level, title, message, {
      context,
      bypassThrottle: true,
      channel: level === 'info' ? 'support' : undefined,
    });
  }

  // ---------------------------------------------------------------------------

  /** Cache::add atômico do Laravel → Map com expiração aqui. */
  private shouldSend(signature: string): boolean {
    const key = createHash('md5').update(signature).digest('hex');
    const now = Date.now();
    const expires = this.throttle.get(key);
    if (expires && expires > now) return false;

    this.throttle.set(key, now + THROTTLE_MS);
    // Limpeza oportunista para o Map não crescer indefinidamente.
    if (this.throttle.size > 500) {
      for (const [k, exp] of this.throttle) {
        if (exp <= now) this.throttle.delete(k);
      }
    }
    return true;
  }

  private isScannerNoise(url?: string): boolean {
    const path = this.pathOf(url).toLowerCase();
    if (!path) return false;
    return SCANNER_NOISE.some((needle) => path.includes(needle));
  }

  private pathOf(url?: string): string {
    if (!url) return '';
    try {
      return new URL(url, 'http://localhost').pathname;
    } catch {
      return url;
    }
  }

  private format(
    level: TelegramLevel,
    title: string,
    message: string,
    options: TelegramNotifyOptions,
  ): string {
    const emoji = LEVEL_EMOJI[level];
    const env = (process.env.NODE_ENV ?? 'development').toUpperCase();
    const app = process.env.TELEGRAM_APP_NAME ?? 'FLUI API';

    const lines: string[] = [];
    lines.push(`<b>${emoji} ${esc(app)} · ${esc(title)} [${level.toUpperCase()}]</b>`);
    lines.push(`<b>🌍 Ambiente:</b> <code>${esc(env)}</code>`);

    const http = options.http;
    if (http) {
      const method = http.method ?? '-';
      const url = http.url ?? '-';
      lines.push(`<b>📍 Endpoint:</b> <code>${esc(method)} ${esc(url)}</code>`);
      if (http.ip) lines.push(`<b>🌐 IP:</b> <code>${esc(http.ip)}</code>`);
      if (http.userAgent)
        lines.push(`<b>🖥️ UA:</b> <code>${esc(truncate(http.userAgent, 160))}</code>`);
    }

    const err = options.error;
    if (err instanceof Error) {
      const at = this.firstStackFrame(err);
      lines.push(`<b>❌ Erro:</b> <code>${esc(err.constructor.name)}</code>`);
      if (at) lines.push(`<b>📂 Origem:</b> <code>${esc(at)}</code>`);
    }

    lines.push(`<b>💬 Mensagem:</b>\n<pre>${esc(truncate(message, 1200))}</pre>`);

    const ctx = this.buildContext(options);
    if (ctx) lines.push(`<b>📦 Contexto:</b>\n<pre>${esc(ctx)}</pre>`);

    lines.push(`<i>⏰ ${new Date().toISOString()}</i>`);

    return truncate(lines.join('\n'), TELEGRAM_MAX_LEN - 32);
  }

  private buildContext(options: TelegramNotifyOptions): string | null {
    const ctx: Record<string, unknown> = { ...(options.context ?? {}) };

    if (options.http?.body && isPlainObject(options.http.body)) {
      const safeBody = redact(options.http.body);
      if (Object.keys(safeBody).length > 0) ctx.body = safeBody;
    }

    if (Object.keys(ctx).length === 0) return null;
    try {
      return JSON.stringify(redact(ctx), null, 2);
    } catch {
      return null;
    }
  }

  private firstStackFrame(err: Error): string | null {
    const line = err.stack
      ?.split('\n')
      .map((l) => l.trim())
      .find((l) => l.startsWith('at ') && !l.includes('node:internal'));
    if (!line) return null;
    // Extrai "arquivo:linha" do frame, encurtando o caminho absoluto.
    const match = line.match(/\(?([^() ]+:\d+:\d+)\)?$/);
    const raw = match ? match[1] : line.replace(/^at\s+/, '');
    const parts = raw.split(/[\\/]/);
    return parts.slice(-2).join('/');
  }

  private async post(text: string, threadId?: string): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const payload: Record<string, unknown> = {
        chat_id: this.chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      };
      if (threadId) payload.message_thread_id = Number(threadId);

      const res = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        // eslint-disable-next-line no-console
        console.error(`[telegram] sendMessage falhou (${res.status}): ${body}`);
        return false;
      }
      return true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[telegram] erro ao enviar: ${e instanceof Error ? e.message : String(e)}`);
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }
}

// --- helpers ----------------------------------------------------------------

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

/** Remove/oculta campos sensíveis recursivamente. */
function redact(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      out[key] = '«oculto»';
    } else if (isPlainObject(value)) {
      out[key] = redact(value);
    } else if (typeof value === 'string' && value.length > 500) {
      out[key] = `${value.slice(0, 500)}… (${value.length} chars)`;
    } else {
      out[key] = value;
    }
  }
  return out;
}

/** Instância única compartilhada por toda a aplicação. */
export const telegram = new TelegramNotifier();
export type { TelegramNotifier };
