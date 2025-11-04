# Android Server Connection Guide

## Problem
Your Android app cannot connect to the server because:
1. Using local IP address (192.168.50.192) that only works on same WiFi network
2. Android security restrictions on HTTP connections
3. Network configuration issues

## Solutions

### Option 1: Use Same WiFi Network (Quickest)
1. Connect both your development machine and Android phone to the SAME WiFi network
2. Find your computer's IP address on the WiFi network:
   - Windows: `ipconfig` - look for "Wireless LAN adapter WiFi" IPv4 address
   - Mac/Linux: `ifconfig` or `ip addr`
3. Update your environment.ts with the correct WiFi IP:
```typescript
apiEndPoint: 'http://YOUR_WIFI_IP:8080/api/v1/',
urlProfileImg: 'http://YOUR_WIFI_IP:8080/uploads/',
```

### Option 2: Configure Network Security (Recommended)
Add network security configuration for Android:

1. Create `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">192.168.50.192</domain>
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain> <!-- Android emulator -->
    </domain-config>
</network-security-config>
```

2. Update `android/app/src/main/AndroidManifest.xml`:
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

### Option 3: Use Public Server (Production)
For production, use a public domain with HTTPS:
```typescript
apiEndPoint: 'https://yourdomain.com/api/v1/',
urlProfileImg: 'https://yourdomain.com/uploads/',
```

### Option 4: Development with Hot Reload
For development, you can run the app with live reload:

1. Start your Angular dev server:
```bash
npm run start
```

2. Update capacitor.config.ts for development:
```typescript
server: {
  url: 'http://YOUR_IP:4200',
  cleartext: true
}
```

3. Sync and run:
```bash
npx cap sync android
npx cap run android
```

### Option 5: Use ngrok for Public Testing
1. Install ngrok: `npm install -g ngrok`
2. Expose your local server:
```bash
ngrok http 8080
```
3. Use the ngrok URL in your environment:
```typescript
apiEndPoint: 'https://YOUR_NGROK_URL.ngrok.io/api/v1/',
```

## Testing Steps

1. **Check Server Accessibility**:
   - From your phone's browser, try accessing: `http://192.168.50.192:8080`
   - If it works, the network is fine
   - If not, use Options 1, 4, or 5

2. **Verify Android Permissions**:
   Ensure `android/app/src/main/AndroidManifest.xml` has:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

3. **Test Connection**:
   - Build and run the app
   - Check Android Studio Logcat for network errors
   - Use browser dev tools if using Option 4

## Quick Fix (Immediate)
1. Connect phone to same WiFi as your server
2. Update environment.ts with correct WiFi IP
3. Rebuild and test:
```bash
npm run build
npx cap sync android
npx cap run android
```

## Server Side Considerations
- Ensure CORS is configured to allow your app's domain
- For production, use HTTPS
- Configure firewall to allow mobile connections
