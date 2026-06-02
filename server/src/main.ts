import { ValidationPipe } from '@nestjs/common';
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
      skipMissingProperties: false,
    }),
  );

  app.useStaticAssets(join(process.cwd(), 'server', 'public', 'uploads'), {
    prefix: '/uploads/',
  });

  const corsOrigin =
    env.CORS_ORIGINS.length > 0
      ? env.CORS_ORIGINS
      : env.NODE_ENV === 'production'
        ? false
        : true;

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api/v1');

  const port = env.PORT;
  const host = env.HOST;

  await app.listen(port, host);

  console.log(`🚀 Server running on http://${host}:${port}`);
}
bootstrap();
