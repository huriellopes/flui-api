import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { AllExceptionsFilter } from '../common/all-exceptions.filter';
import { TelegramService } from './telegram.service';

/**
 * Módulo global de observabilidade via Telegram.
 * - Exporta o TelegramService para injeção em qualquer módulo.
 * - Registra o filtro global que captura e reporta todas as exceções.
 */
@Global()
@Module({
  providers: [TelegramService, { provide: APP_FILTER, useClass: AllExceptionsFilter }],
  exports: [TelegramService],
})
export class TelegramModule {}
