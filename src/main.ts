import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { join } from 'path';

import { AppModule } from './app.module';
import { TelegramLogger } from './common/telegram-logger';
import { telegram } from './telegram/telegram.notifier';

/**
 * Protege a documentação com Basic Auth enquanto ela for privada.
 * Defina DOCS_PUBLIC=true para liberar ao público no futuro.
 */
function docsAuth(req: Request, res: Response, next: NextFunction) {
  if (process.env.DOCS_PUBLIC === 'true') return next();

  const user = process.env.DOCS_USER;
  const pass = process.env.DOCS_PASSWORD;
  const header = req.headers.authorization ?? '';

  if (user && pass && header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    if (decoded.slice(0, idx) === user && decoded.slice(idx + 1) === pass) {
      return next();
    }
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Notify Water Health API Docs"');
  res.status(401).send('Autenticação necessária para acessar a documentação.');
}

/**
 * Encaminha crashes de baixo nível (fora do ciclo de request) para o Telegram
 * antes de o processo morrer. Dá o alerta e mantém o comportamento padrão.
 */
function registerProcessHandlers(): void {
  process.on('unhandledRejection', (reason) => {
    // eslint-disable-next-line no-console
    console.error('unhandledRejection:', reason);
    void telegram.system(
      'critical',
      'Unhandled Rejection',
      reason instanceof Error ? reason.message : String(reason),
      { error: reason instanceof Error ? reason.stack : undefined },
    );
  });

  process.on('uncaughtException', (err) => {
    // eslint-disable-next-line no-console
    console.error('uncaughtException:', err);
    void telegram.system('fatal', 'Uncaught Exception', err.message, {
      error: err.stack,
    });
  });
}

async function bootstrap() {
  registerProcessHandlers();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  // Logger que também espelha warn/error/fatal para o Telegram.
  app.useLogger(new TelegramLogger());
  // Corpo maior para uploads de imagem em base64.
  app.useBodyParser('json', { limit: '12mb' });
  // CSP off (Swagger UI) e CORP cross-origin (imagens carregadas pelo app).
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  // Serve as imagens dos posts em /uploads (fora do prefixo /api).
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  // Documentação OpenAPI (privada por Basic Auth) em /docs
  app.use(['/docs', '/docs-json'], docsAuth);
  const config = new DocumentBuilder()
    .setTitle('Notify Water Health API')
    .setDescription('API de hidratação, nutrição, treinos e gamificação social.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Avisa o Telegram quando a API está sendo encerrada (deploy/reinício/crash).
  app.enableShutdownHooks();
  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.on(signal, () => {
      void telegram.notice(
        'warning',
        'API encerrando',
        `Recebido ${signal} — a API está sendo desligada.`,
      );
    });
  }

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Notify Water Health API rodando na porta ${port}`);

  // Sinaliza no Telegram (tópico Geral) que a API subiu com sucesso.
  void telegram.notice('info', 'API online', `🚀 A API subiu com sucesso na porta ${port}.`, {
    version: process.env.npm_package_version ?? '0.1.0',
  });
}
bootstrap();
