import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { telegram } from '../telegram/telegram.notifier';

/** Contexto de log usado aqui; o AppLogger o ignora para não duplicar alertas. */
export const HTTP_EXCEPTION_LOG_CONTEXT = 'HttpExceptions';

/**
 * Captura TODA exceção não tratada, responde ao cliente no formato padrão e
 * dispara o alerta no Telegram (roteado por status e com throttle no notifier).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(HTTP_EXCEPTION_LOG_CONTEXT);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = this.responseBody(exception, status, req);

    // Log local (arquivo/console) — sempre. 5xx com stack, 4xx só a linha.
    if (status >= 500) {
      this.logger.error(
        `${status} ${req.method} ${req.url} — ${this.messageOf(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${status} ${req.method} ${req.url} — ${this.messageOf(exception)}`);
    }

    // Alerta no Telegram (não bloqueia a resposta ao cliente).
    void telegram.reportHttpException(exception, {
      method: req.method,
      url: req.originalUrl ?? req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      status,
      body: this.safeBody(req),
    });

    res.status(status).json(body);
  }

  private responseBody(exception: unknown, status: number, req: Request): Record<string, unknown> {
    const base = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req.originalUrl ?? req.url,
    };

    if (exception instanceof HttpException) {
      const resp = exception.getResponse();
      if (typeof resp === 'string') return { ...base, message: resp };
      return { ...base, ...(resp as Record<string, unknown>) };
    }

    return { ...base, message: 'Internal server error' };
  }

  private messageOf(exception: unknown): string {
    if (exception instanceof HttpException) {
      const resp = exception.getResponse();
      if (typeof resp === 'string') return resp;
      const msg = (resp as { message?: unknown }).message;
      return Array.isArray(msg) ? msg.join(', ') : String(msg ?? exception.message);
    }
    return exception instanceof Error ? exception.message : String(exception);
  }

  private safeBody(req: Request): unknown {
    const method = req.method?.toUpperCase();
    if (method === 'GET' || method === 'HEAD') return undefined;
    return req.body;
  }
}
