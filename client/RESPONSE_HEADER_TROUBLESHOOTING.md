# Empty Response Header Troubleshooting

## Problem: Response Headers Are Empty

When you make API calls from your Android app and the response headers appear empty, this is typically caused by:

1. **CORS configuration issues**
2. **Missing response headers in NestJS**
3. **Network security restrictions**

## Solutions

### 1. Enhanced NestJS CORS Configuration

Update your `main.ts` with more comprehensive CORS settings:

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enhanced CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://10.190.238.187:8080',
      'capacitor://localhost',
      'http://localhost',
      'http://10.190.238.187' // Add without port
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    exposedHeaders: [
      'Content-Type',
      'Authorization',
      'Content-Length',
      'X-Request-Id',
      'X-Powered-By'
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // Add global response headers middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Expose-Headers', 'Content-Type, Authorization, Content-Length');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  });
  
  await app.listen(8080, '0.0.0.0');
  console.log(`Server running on http://0.0.0.0:8080`);
}
bootstrap();
```

### 2. Test Your API Endpoints

Create a simple test endpoint to verify headers:

```typescript
// src/app.controller.ts
import { Controller, Get, Res, Header } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  
  @Get('health')
  @Header('Content-Type', 'application/json')
  @Header('X-Custom-Header', 'Test Value')
  healthCheck(@Res() res: Response) {
    return res
      .header('X-Test-Header', 'Working')
      .json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
      });
  }

  @Get('test-headers')
  testHeaders(@Res() res: Response) {
    return res
      .header('Content-Type', 'application/json')
      .header('X-Custom-Header', 'Test Value')
      .header('X-API-Version', '1.0')
      .json({ 
        success: true,
        headers: 'Should be visible in response'
      });
  }
}
```

### 3. Test from Command Line

Check if headers are visible from curl:

```bash
# Test health endpoint
curl -I http://10.190.238.187:8080/health

# Test with verbose output
curl -v http://10.190.238.187:8080/health

# Test with headers
curl -H "Origin: http://localhost" http://10.190.238.187:8080/health
```

### 4. Check Android Network Debugging

Add network debugging to your Angular service:

```typescript
// In your API service
import { HttpClient, HttpHeaders } from '@angular/core';

@Injectable()
export class ApiService {
  constructor(private http: HttpClient) {}

  testConnection() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    });

    return this.http.get('http://10.190.238.187:8080/health', { 
      headers,
      observe: 'response' // This gives you full response including headers
    }).subscribe({
      next: (response) => {
        console.log('Full Response:', response);
        console.log('Headers:', response.headers);
        console.log('Status:', response.status);
      },
      error: (error) => {
        console.error('Error:', error);
        console.error('Error Headers:', error.headers);
      }
    });
  }
}
```

### 5. Common Issues and Fixes

#### Issue 1: Preflight OPTIONS Request Failing
```typescript
// Add OPTIONS handler in your controller
@Options('*')
@Header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
@Header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
handleOptions() {
  return;
}
```

#### Issue 2: Missing Exposed Headers
Make sure CORS exposes the headers you want to see:
```typescript
exposedHeaders: [
  'Content-Type',
  'Authorization', 
  'Content-Length',
  'X-Request-Id'
]
```

#### Issue 3: Android Network Security
Double-check your `network_security_config.xml`:
```xml
<domain includeSubdomains="true">10.190.238.187</domain>
```

### 6. Debugging Steps

1. **Test from browser first** - Open `http://10.190.238.187:8080/health` in Chrome and check Network tab
2. **Check server logs** - Look for CORS errors
3. **Test with Postman** - Verify headers are working outside the app
4. **Check Android Logcat** - Look for network errors
5. **Verify firewall** - Ensure port 8080 is open

### 7. Quick Verification

Run these commands to test:

```bash
# Check if server is accessible
telnet 10.190.238.187 8080

# Test headers with curl
curl -H "Origin: http://localhost" -I http://10.190.238.187:8080/health

# Test from different device on same network
curl http://10.190.238.187:8080/health
```

If headers are visible in curl/Postman but not in your Android app, the issue is likely with your CORS configuration or Android network security settings.
