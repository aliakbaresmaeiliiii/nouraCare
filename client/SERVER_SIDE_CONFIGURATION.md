# Server Side Configuration for Mobile App

## Essential Server Configuration

### 1. CORS Configuration for NestJS
Your NestJS server needs to allow requests from your mobile app.

#### Method 1: Enable CORS in main.ts (Recommended)
```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for mobile app
  app.enableCors({
    origin: [
      'http://localhost:4200', // Angular dev server
      'http://10.190.238.187:8080', // Your server IP
      'capacitor://localhost', // Capacitor iOS
      'http://localhost' // Capacitor Android
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });
  
  await app.listen(8080, '0.0.0.0');
}
bootstrap();
```

#### Method 2: Using environment configuration
```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  app.enableCors({
    origin: configService.get('CORS_ORIGINS').split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });
  
  await app.listen(8080, '0.0.0.0');
}
bootstrap();
```

#### Environment Configuration (.env)
```env
CORS_ORIGINS=http://localhost:4200,http://10.190.238.187:8080,capacitor://localhost,http://localhost
```

#### Method 3: Global CORS in AppModule
```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CorsGuard, // Custom CORS guard
    },
  ],
})
export class AppModule {}
```

// Custom CORS Guard
```typescript
// src/common/guards/cors.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class CorsGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    response.header('Access-Control-Allow-Origin', [
      'http://localhost:4200',
      'http://10.190.238.187:8080',
      'capacitor://localhost',
      'http://localhost'
    ]);
    response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.header('Access-Control-Allow-Credentials', 'true');
    
    return true;
  }
}
```

### 2. Network Configuration

#### Bind to All Interfaces
Make sure your server binds to `0.0.0.0` (all interfaces) not just `localhost`:

**Node.js:**
```javascript
app.listen(8080, '0.0.0.0', () => {
  console.log('Server running on http://0.0.0.0:8080');
});
```

**Spring Boot:**
```properties
# application.properties
server.address=0.0.0.0
server.port=8080
```

### 3. Firewall Configuration

#### Windows Firewall:
1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Allow another app" and browse to your server executable
4. Or create a rule for port 8080:
   ```cmd
   netsh advfirewall firewall add rule name="Backend Port 8080" dir=in action=allow protocol=TCP localport=8080
   ```

#### Linux/macOS:
```bash
# If using ufw (Ubuntu)
sudo ufw allow 8080/tcp

# If using iptables
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
```

### 4. Environment Configuration

#### Create environment-specific configs:

**Development (dev.env):**
```
NODE_ENV=development
PORT=8080
HOST=0.0.0.0
CORS_ORIGIN=*
DATABASE_URL=your_dev_db_url
```

**Production (prod.env):**
```
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
CORS_ORIGIN=https://yourdomain.com
DATABASE_URL=your_prod_db_url
```

### 5. Security Headers

Add security headers for mobile apps:
```javascript
// Express.js middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});
```

### 6. Quick Test Commands

#### Test if server is accessible:
```bash
# From your phone's browser
http://10.190.238.187:8080

# From command line (should return response)
curl http://10.190.238.187:8080/api/v1/health

# Check if port is open
telnet 10.190.238.187 8080
```

#### Common Server Startup Commands:

**Node.js:**
```bash
npm start
# or
node server.js
# or with environment
NODE_ENV=development node server.js
```

**Spring Boot:**
```bash
./mvnw spring-boot:run
# or
java -jar your-app.jar
```

### 7. Troubleshooting

#### If connection fails:
1. **Check if server is running:**
   ```bash
   netstat -an | findstr 8080  # Windows
   netstat -tulpn | grep 8080  # Linux
   lsof -i :8080               # macOS
   ```

2. **Check firewall:**
   ```bash
   # Windows
   netsh advfirewall firewall show rule name="Backend Port 8080"
   ```

3. **Test from different devices:**
   - Try accessing from another computer on same network
   - Try from your phone's browser
   - Check if localhost works but IP doesn't

4. **Check server logs:**
   - Look for CORS errors
   - Check for binding errors
   - Verify request logs

### 8. Production Considerations

For production deployment:
- Use HTTPS with SSL certificates
- Configure proper CORS origins (your domain only)
- Use environment variables for configuration
- Set up reverse proxy (nginx/Apache)
- Configure load balancing if needed
- Set up monitoring and logging

## Immediate Action Items

1. **Start your backend server** on port 8080
2. **Configure CORS** to allow mobile requests
3. **Bind to 0.0.0.0** not localhost
4. **Open firewall** for port 8080
5. **Test connectivity** from your phone's browser

Once these are configured, your Android app should be able to connect successfully!
