import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync('./certs/key.pem'),
    cert: fs.readFileSync('./certs/cert.pem'),
  };

  // ✅ اینجا باید httpsOptions پاس داده بشه
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
      forbidNonWhitelisted: false,
      skipMissingProperties: true,
    }),
  );

  app.useStaticAssets(join(process.cwd(), 'server', 'public', 'uploads'), {
    prefix: '/uploads/',
  });

  app.enableCors({
    origin: ['http://localhost:8080', 'http://192.168.50.193:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 8080;
  const host = process.env.HOST || '0.0.0.0';

  await app.listen(port, host);

  console.log(`🚀 Server running on https://${host}:${port}`);
}
bootstrap();
