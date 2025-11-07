# Client-Side Configuration Guide

## Issues Found in Your Current Configuration

### 1. Protocol Mismatch
- **Server**: Running on HTTPS (`https://192.168.50.193:8080`)
- **Client**: Configured for HTTP (`http://192.168.50.193:8080`)

### 2. Missing CORS Configuration
- Your IP `192.168.50.193` is not in the server's allowed CORS origins

## Corrected Client Configuration

### environment.ts (Angular/Ionic)
```typescript
export const environment = {
  production: false,
  apiEndPoint: 'https://192.168.50.193:8080/api/v1',
  urlProfileImg: 'https://192.168.50.193:8080/uploads/',
};
```

### capacitor.config.ts
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tecknnycs.gahvareh',
  appName: 'Social Sharing App',
  webDir: 'www',
  server: {
    androidScheme: 'https', // Changed from http to https
    allowNavigation: ['192.168.50.193'],
    cleartext: true, // Add this for development
  },
};

export default config;
```

### network_security_config.xml (Android)
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">192.168.50.193</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
    <!-- Add base-config for HTTPS support -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="@raw/cert"/> <!-- If using custom cert -->
            <certificates src="system"/>
        </trust-anchors>
    </base-config>
</network-security-config>
```

## Alternative: Use HTTP for Development

If you prefer to use HTTP during development, update the server configuration:

### Option A: HTTP Server (Development Only)
```typescript
// In src/main.ts, remove httpsOptions
const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  // Remove httpsOptions for HTTP
  bodyParser: true,
  rawBody: true,
});
```

Then update client to use HTTP:
```typescript
// environment.ts
export const environment = {
  production: false,
  apiEndPoint: 'http://192.168.50.193:8080/api/v1',
  urlProfileImg: 'http://192.168.50.193:8080/uploads/',
};
```

### Option B: Mixed Mode (Recommended)
Keep HTTPS but add HTTP support:

```typescript
// In src/main.ts
const httpsOptions = {
  key: fs.readFileSync('./certs/key.pem'),
  cert: fs.readFileSync('./certs/cert.pem'),
};

const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  httpsOptions,
  bodyParser: true,
  rawBody: true,
});

// Add HTTP support on port 8081 for development
const httpApp = await NestFactory.create(AppModule);
await httpApp.listen(8081);
```

## Server CORS Update Needed

Add your IP to the server's CORS configuration:

```typescript
// In src/main.ts
app.enableCors({
  origin: [
    'http://localhost:4200', 
    'http://localhost:8100', 
    'capacitor://localhost', 
    'ionic://localhost',
    'http://192.168.50.193:8100', // Add your IP
    'https://192.168.50.193:8100' // Add HTTPS version
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400,
});
```

## Testing the Connection

Use this updated test script for HTTPS:

```javascript
// test-onboarding-https.js
const https = require('https');

const onboardingData = {
  pregnancy_status: 'tracking',
  last_period: '2025-10-01',
  cycle_length: 28,
  period_length: 5,
  health_goals: '["weight_management", "fertility_tracking"]',
  notifications: true
};

const data = JSON.stringify(onboardingData);

const req = https.request({
  hostname: '192.168.50.193',
  port: 8080,
  path: '/api/v1/onboarding/save',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  },
  rejectUnauthorized: false // For self-signed certificates
}, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
    console.log('✅ HTTPS connection working!');
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(data);
req.end();
```

## Quick Fix Summary

1. **Change client to HTTPS** in environment.ts
2. **Update Capacitor to use HTTPS** in capacitor.config.ts
3. **Add your IP to server CORS** in main.ts
4. **Test with the updated HTTPS script**

This should resolve the request cancellation issues you're experiencing.
