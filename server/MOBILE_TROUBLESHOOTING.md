# Mobile Connection Troubleshooting

## Current Status
- ✅ Server is running on `https://192.168.50.193:8080`
- ✅ HTTPS connection works from laptop
- ✅ CORS configured for mobile IPs
- ❌ Mobile requests still being cancelled

## Mobile-Specific Issues to Check

### 1. SSL Certificate Trust (Most Likely)
Mobile devices are stricter about SSL certificates. Since you're using self-signed certificates:

**Android Solution:**
```xml
<!-- In network_security_config.xml -->
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="@raw/cert"/> <!-- Add your cert -->
            <certificates src="system"/>
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">192.168.50.193</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

**Alternative: Use HTTP for Development**
```typescript
// In src/main.ts - Remove HTTPS for development
const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  // Remove httpsOptions
  bodyParser: true,
  rawBody: true,
});
```

### 2. Check Mobile Network Configuration

**On Mobile Device:**
1. Open browser and visit: `https://192.168.50.193:8080/api/v1`
2. Accept the SSL certificate warning
3. Try the onboarding endpoint

### 3. Mobile App Debugging

**Add Network Interceptor for Debugging:**
```typescript
// In your Angular service
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, timeout } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  constructor(private http: HttpClient) {}

  saveOnboardingData(data: any) {
    console.log('Sending onboarding data:', data);
    
    return this.http.post(`${environment.apiEndPoint}/onboarding/save`, data)
      .pipe(
        timeout(30000), // 30 second timeout
        catchError((error: HttpErrorResponse) => {
          console.error('Onboarding save error:', error);
          console.error('Error details:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            message: error.message
          });
          return throwError(error);
        })
      );
  }
}
```

### 4. Immediate Testing Steps

**Step 1: Test with HTTP (Quick Fix)**
```bash
# Stop current server and restart without HTTPS
# Remove httpsOptions from main.ts and restart
npm run start:dev
```

Then update client to HTTP:
```typescript
// environment.ts
export const environment = {
  production: false,
  apiEndPoint: 'http://192.168.50.193:8080/api/v1',
  urlProfileImg: 'http://192.168.50.193:8080/uploads/',
};
```

**Step 2: Check Mobile Browser**
1. On mobile: Open Chrome
2. Visit: `https://192.168.50.193:8080/api/v1`
3. Accept any certificate warnings
4. If this works, the issue is SSL certificate trust

**Step 3: Enable Detailed Logging**
Add this to your mobile app's main component:
```typescript
ngOnInit() {
  // Test connection on app start
  this.testConnection();
}

testConnection() {
  fetch('https://192.168.50.193:8080/api/v1')
    .then(response => {
      console.log('Connection test response:', response.status);
      return response.text();
    })
    .then(data => console.log('Connection test data:', data))
    .catch(error => console.error('Connection test error:', error));
}
```

### 5. Common Mobile-Specific Issues

**Certificate Pinning:**
- Mobile apps may reject self-signed certificates
- Solution: Add certificate to app bundle or use HTTP

**Network Security Policy:**
- Android 9+ requires explicit network security config
- iOS requires App Transport Security exceptions

**CORS with Mobile Schemes:**
- Capacitor uses `capacitor://` scheme
- Ionic uses `ionic://` scheme
- Make sure these are in CORS origins

### 6. Quick Diagnostic Script
Create this in your mobile app to test connectivity:
```typescript
async testAllEndpoints() {
  const endpoints = [
    'https://192.168.50.193:8080/api/v1',
    'https://192.168.50.193:8080/api/v1/onboarding/save'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`${endpoint}: ${response.status}`);
    } catch (error) {
      console.error(`${endpoint}: ${error.message}`);
    }
  }
}
```

## Most Likely Solution
The issue is almost certainly **SSL certificate trust** on mobile. Try using HTTP for development first to confirm this is the root cause.
