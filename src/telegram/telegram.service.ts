import { Injectable } from '@nestjs/common';

import { HttpContext, TelegramLevel, TelegramNotifyOptions, telegram } from './telegram.notifier';

/**
 * Wrapper injetável do notificador do Telegram, para uso idiomático nos
 * providers/controllers do Nest. Delega tudo para o singleton `telegram`.
 */
@Injectable()
export class TelegramService {
  get enabled(): boolean {
    return telegram.enabled;
  }

  notify(
    level: TelegramLevel,
    title: string,
    message: string,
    options?: TelegramNotifyOptions,
  ): Promise<boolean> {
    return telegram.notify(level, title, message, options);
  }

  /** Aviso intencional (regra de negócio suspeita, limite atingido, etc.). */
  warning(title: string, message: string, context?: Record<string, unknown>): Promise<boolean> {
    return telegram.warning(title, message, context);
  }

  /** Erro acionável (algo quebrou, mas foi tratado). */
  error(title: string, message: string, context?: Record<string, unknown>): Promise<boolean> {
    return telegram.notify('error', title, message, { context });
  }

  reportHttpException(error: unknown, http: HttpContext): Promise<boolean> {
    return telegram.reportHttpException(error, http);
  }
}
