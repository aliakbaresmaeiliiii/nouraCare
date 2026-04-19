import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import fs from 'fs';
import helmet from 'helmet';

  // Use HTTP instead of HTTPS to avoid SSL certificate issues on mobile
async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync('./certs/key.pem'),
    cert: fs.readFileSync('./certs/cert.pem'),
  };

  // ✅ اینجا باید httpsOptions پاس داده بشه
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(
    helmet({
      // Strict CSP is enforced on the Angular host (many CDNs/scripts); API stays JSON-first.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

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
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    // allowedHeaders: ['Content-Type', 'Authorization'],
    allowedHeaders: ['Content-Type', 'Authorization'] 
  });

  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';

  await app.listen(port, host);

  console.log(`🚀 Server running on http://${host}:${port}`);
}
bootstrap();
