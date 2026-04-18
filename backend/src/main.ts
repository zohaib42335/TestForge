import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import express from 'express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

function normalizeBrowserOrigin(raw: string): string {
  return raw
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\/$/, '');
}

function buildAllowedOrigins(configService: ConfigService): Set<string> {
  const fallback = 'https://test-forge-sooty.vercel.app';
  const fromEnv = configService.get<string>('FRONTEND_URL');
  const raw = fromEnv?.trim() ? fromEnv : fallback;
  const set = new Set<string>();
  for (const part of raw.split(',')) {
    const o = normalizeBrowserOrigin(part);
    if (o.length > 0) set.add(o);
  }
  return set;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const allowedOrigins = buildAllowedOrigins(configService);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const port = configService.get<number>('PORT', 3000);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const normalized = normalizeBrowserOrigin(origin);
      if (allowedOrigins.has(normalized)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  });

  app.use(
    '/api/v1/billing/webhook',
    express.raw({ type: 'application/json' }),
    (
      req: express.Request & { rawBody?: Buffer },
      _res: express.Response,
      next: express.NextFunction,
    ) => {
      req.rawBody = req.body as Buffer;
      next();
    },
  );

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix('api/v1');

  if (nodeEnv === 'development') {
    const config = new DocumentBuilder()
      .setTitle('TestForge API')
      .setDescription('API documentation for TestForge SaaS backend')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port);
}
bootstrap();
