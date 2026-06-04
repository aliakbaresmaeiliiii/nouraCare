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

  const devOrigins = [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'http://localhost:8100',
    'http://127.0.0.1:8100',
    'http://172.20.10.2:8100',
    'capacitor://localhost',
    'ionic://localhost',
    'https://localhost',
  ];

  const corsOrigin =
    env.NODE_ENV !== 'production'
      ? env.CORS_ORIGINS.length > 0
        ? [...new Set([...env.CORS_ORIGINS, ...devOrigins])]
        : true
      : env.CORS_ORIGINS.length > 0
        ? env.CORS_ORIGINS
        : false;

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  app.setGlobalPrefix('api/v1');

  const port = env.PORT;
  const host = env.HOST;

  await app.listen(port, host);

  console.log(`🚀 Server running on http://${host}:${port}`);
}
bootstrap();
