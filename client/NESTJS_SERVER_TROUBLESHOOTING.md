# NestJS Server Connection Refused Troubleshooting

## Problem: `ERR_CONNECTION_REFUSED` or Empty Response

Your NestJS server is running on port 8080 but not responding to requests. This usually means:

1. **NestJS application crashed during startup**
2. **Missing controllers/routes**
3. **Database connection issues (Prisma)**
4. **Application not properly bootstrapped**

## Immediate Solutions

### 1. Check NestJS Application Status

**Restart your NestJS server:**
```bash
# Stop current server (Ctrl+C)
# Then restart
npm run start:dev
```

**Check for startup errors in the console:**
- Look for Prisma connection errors
- Look for missing module errors
- Look for dependency injection errors

### 2. Create a Basic Health Endpoint

Add this to your main controller to test if the server is working:

```typescript
// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  
  @Get()
  getHello(): string {
    return 'NestJS Server is running!';
  }

  @Get('health')
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('api/v1/health')
  apiHealthCheck(): { status: string; version: string } {
    return {
      status: 'API is working',
      version: '1.0',
    };
  }
}
```

### 3. Test Step by Step

**Step 1: Test basic server response**
```bash
curl http://localhost:8080
```
Should return: `NestJS Server is running!`

**Step 2: Test health endpoint**
```bash
curl http://localhost:8080/health
```
Should return JSON response

**Step 3: Test API endpoint**
```bash
curl http://localhost:8080/api/v1/health
```

### 4. Common NestJS Issues

#### Issue 1: Prisma Connection Failed
```typescript
// Check your Prisma service
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    console.log('Prisma connected successfully');
  }
}
```

#### Issue 2: Missing Controller
Make sure your controllers are properly imported in `app.module.ts`:
```typescript
@Module({
  imports: [],
  controllers: [AppController, UserController], // Add all controllers
  providers: [AppService, PrismaService],
})
export class AppModule {}
```

#### Issue 3: CORS Blocking Requests
Even though we configured CORS, test without it temporarily:
```typescript
// In main.ts - temporarily allow all origins
app.enableCors({
  origin: '*', // Allow everything for testing
});
```

### 5. Debugging Steps

#### Check Server Logs:
```bash
# Look for any error messages when starting NestJS
npm run start:dev
```

#### Test Database Connection:
```bash
# Test Prisma connection
npx prisma db push
npx prisma generate
```

#### Verify Module Structure:
Make sure you have:
- `src/main.ts` - Application bootstrap
- `src/app.module.ts` - Root module
- `src/app.controller.ts` - At least one controller
- Working Prisma configuration

### 6. Quick Fix - Create Minimal Working App

If nothing works, create a minimal test:

**main.ts:**
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: '*',
  });
  
  await app.listen(8080, '0.0.0.0');
  console.log('Server running on http://0.0.0.0:8080');
}
bootstrap();
```

**app.controller.ts:**
```typescript
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Server is working!';
  }

  @Get('health')
  healthCheck() {
    return { status: 'OK', time: new Date() };
  }
}
```

**app.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
```

### 7. Test Connectivity

Once your server responds locally, test from your phone:
```
http://10.190.238.187:8080/health
```

If this works but your API endpoints don't, the issue is with your specific controllers/routes.

## Immediate Action

1. **Restart your NestJS server** and check for startup errors
2. **Add the basic health endpoints** above
3. **Test step by step** starting with the root endpoint
4. **Check your Prisma configuration** if using database

The empty response suggests your NestJS app started but then encountered an error that's preventing it from handling requests properly.
