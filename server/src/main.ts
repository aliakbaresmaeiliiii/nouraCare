import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { env } from './auth/config/env';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useStaticAssets(join(process.cwd(), 'server', 'public', 'uploads'), {
    prefix: '/uploads/',
  });

  const defaultOrigins = [
    'https://dorehealth.ir',
    'https://www.dorehealth.ir',
    'https://app.dorehealth.ir',
  ];

  const allowedOrigins = [
    ...new Set([...defaultOrigins, ...(env.CORS_ORIGINS ?? [])]),
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      Logger.warn(`Blocked by CORS: ${origin}`, 'CORS');
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Requested-With',
    ],
  });

  app.setGlobalPrefix('api/v1');

  await app.listen(env.PORT, env.HOST);

  Logger.log(
    `Server running on http://${env.HOST}:${env.PORT}`,
    'Bootstrap',
  );
}

bootstrap();