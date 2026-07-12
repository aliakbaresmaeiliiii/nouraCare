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
    'capacitor://localhost',
    'ionic://localhost',
    'https://localhost',
  ];

  const allowedOrigins: string[] | true =
    env.NODE_ENV !== 'production'
      ? env.CORS_ORIGINS.length > 0
        ? [...new Set([...env.CORS_ORIGINS, ...devOrigins])]
        : true
      : env.CORS_ORIGINS.length > 0
        ? env.CORS_ORIGINS
        : [];

  app.enableCors({
    origin: (origin, callback) => {
      // Native apps (Capacitor) and server-to-server calls often omit Origin.
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins === true || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  const port = env.PORT;
  const host = env.HOST;

  await app.listen(port, host);

  Logger.log(`Server running on http://${host}:${port}`, 'Bootstrap');
}
bootstrap();
