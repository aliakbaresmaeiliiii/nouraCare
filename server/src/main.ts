import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync('certs/key.pem'),
    cert: fs.readFileSync('certs/cert.pem'),
  };

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
    origin: true,
    credentials: true,
    //   origin: [
    //     'https://localhost:4200', // Angular dev server
    //     'https://10.190.238.186:8080', // Your server IP
    //     'https://10.190.238.187:8080', // Mobile app IP
    //     'capacitor://localhost', // Capacitor iOS
    //     'https://localhost', // Capacitor Android
    //     'https://localhost:8080', // HTTPS localhost with port
    //     /^https:\/\/10\.190\.238\.\d+:\d+$/, // Allow any IP in the 10.190.238.x range
    //     /^https:\/\/192\.168\.\d+\.\d+:\d+$/, // Allow any IP in the 192.168.x.x range
    //     /^https:\/\/localhost:\d+$/, // Allow localhost with any port
    //   ],
    //   allowedHeaders: [
    //     'Content-Type',
    //     'Authorization',
    //     'X-Requested-With',
    //     'Accept',
    //     'Origin',
    //     'Access-Control-Request-Method',
    //     'Access-Control-Request-Headers',
    //   ],
    //   exposedHeaders: [
    //     'Content-Type',
    //     'Authorization',
    //     'Content-Length',
    //     'X-Request-Id',
    //     'X-Powered-By',
    //   ],
    //   credentials: true,
    //   maxAge: 86400, // 24 hours
    //   preflightContinue: false,
    //   optionsSuccessStatus: 204,
    // });
    // app.use((req, res, next) => {
    //   res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    //   res.header(
    //     'Access-Control-Allow-Methods',
    //     'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    //   );
    //   res.header(
    //     'Access-Control-Allow-Headers',
    //     'Content-Type, Authorization, X-Requested-With',
    //   );
    //   res.header(
    //     'Access-Control-Expose-Headers',
    //     'Content-Type, Authorization, Content-Length',
    //   );
    //   res.header('Access-Control-Allow-Credentials', 'true');
    //   console.log(
    //     '[REQ]',
    //     req.method,
    //     req.url,
    //     'from',
    //     req.ip || req.connection.remoteAddress,
    //   );
    //   next();
  });
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 8080;
  const host = process.env.HOST || '0.0.0.0';

  await app.listen(port, host);
  console.log(`🚀 Server running on https://${host}:${port}`);
}
bootstrap();
