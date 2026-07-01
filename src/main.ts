import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module';

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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // CSP desligada para o Swagger UI renderizar; a API não serve HTML sensível.
  app.use(helmet({ contentSecurityPolicy: false }));
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

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Notify Water Health API rodando na porta ${port}`);
}
bootstrap();
