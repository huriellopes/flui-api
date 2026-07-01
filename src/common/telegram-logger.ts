import { ConsoleLogger } from '@nestjs/common';

import { TelegramLevel, telegram } from '../telegram/telegram.notifier';
import { HTTP_EXCEPTION_LOG_CONTEXT } from './all-exceptions.filter';

/**
 * Logger que estende o ConsoleLogger padrão do Nest e, além de imprimir no
 * console, encaminha `warn`/`error`/`fatal` para o Telegram. Cobre "qualquer
 * incidência" registrada por qualquer parte da app ou do próprio framework.
 *
 * Não encaminha logs do filtro de exceções HTTP (que já envia um alerta rico),
 * evitando duplicidade. Ligável/desligável via TELEGRAM_FORWARD_LOGS.
 */
export class TelegramLogger extends ConsoleLogger {
  private get forwardEnabled(): boolean {
    return telegram.enabled && process.env.TELEGRAM_FORWARD_LOGS !== 'false';
  }

  error(message: unknown, ...rest: unknown[]): void {
    super.error(message as string, ...(rest as string[]));
    this.forward('error', message, rest);
  }

  warn(message: unknown, ...rest: unknown[]): void {
    super.warn(message as string, ...(rest as string[]));
    this.forward('warning', message, rest);
  }

  fatal(message: unknown, ...rest: unknown[]): void {
    // ConsoleLogger.fatal existe no Nest 10+; fallback para error se ausente.
    if (typeof super.fatal === 'function') {
      super.fatal(message as string, ...(rest as string[]));
    } else {
      super.error(message as string, ...(rest as string[]));
    }
    this.forward('fatal', message, rest);
  }

  private forward(level: TelegramLevel, message: unknown, rest: unknown[]): void {
    if (!this.forwardEnabled) return;

    const context = this.contextFrom(rest);
    // O filtro de exceções já envia um alerta detalhado; não duplica.
    if (context === HTTP_EXCEPTION_LOG_CONTEXT) return;

    const text = this.stringify(message);
    void telegram.notify(level, context ?? 'Log', text, {
      signature: `log|${level}|${context ?? ''}|${text.slice(0, 120)}`,
    });
  }

  /** No Nest, o último argumento string costuma ser o "context" do logger. */
  private contextFrom(rest: unknown[]): string | undefined {
    for (let i = rest.length - 1; i >= 0; i--) {
      if (typeof rest[i] === 'string') return rest[i] as string;
    }
    return undefined;
  }

  private stringify(message: unknown): string {
    if (typeof message === 'string') return message;
    if (message instanceof Error) return message.message;
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }
}
