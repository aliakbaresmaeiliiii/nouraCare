# Mobile App Connection Troubleshooting Guide

## Current Status: ✅ Server is Accessible
- ✅ Network connectivity to `192.168.50.193` is working
- ✅ Backend server is running on port 8080
- ✅ API endpoint responds correctly to curl requests
- ✅ Android project has been synced with latest changes

## Why Requests Might Not Reach Backend

### 1. **Check Android App Configuration**

**Verify the app is using the correct configuration:**
1. Open Android Studio
2. Open the `android` folder from your project
3. Build and run the app
4. Check Android Studio logs for any network errors

### 2. **Test from Android Device/Emulator**

**Check if the device can reach your server:**
1. Open Chrome browser on your Android device
2. Navigate to: `http://192.168.50.193:8080/api/v1/`
3. You should see "Hello World!" response
4. If this fails, there's a network issue between device and server

### 3. **Common Mobile-Specific Issues**

#### A. **Network Security Configuration**
Make sure your `network_security_config.xml` is properly configured:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">192.168.50.193</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

#### B. **Android Manifest Permissions**
Ensure INTERNET permission is included:
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

#### C. **Capacitor Configuration**
Verify `capacitor.config.ts`:
```typescript
server: {
  androidScheme: 'http',
  allowNavigation: ['192.168.50.193', 'localhost'],
  cleartext: true,
}
```

### 4. **Debug Steps**

#### Step 1: Check Android Logs
```bash
# In Android Studio, check Logcat for:
# - Network requests
# - CORS errors
# - SSL/TLS errors
# - Connection refused errors
```

#### Step 2: Test Different Endpoints
Try accessing different API endpoints from your mobile browser:
- `http://192.168.50.193:8080/api/v1/auth/sign-in`
- `http://192.168.50.193:8080/api/v1/health`

#### Step 3: Check Server CORS Configuration
Your server needs to accept requests from the mobile app. Update your NestJS server:

```typescript
// src/main.ts
app.enableCors({
  origin: [
    'http://localhost:4200',
    'http://192.168.50.193:8080',
    'capacitor://localhost',
    'http://localhost',
    'http://192.168.50.193' // Add this
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'User-Id'],
  credentials: true,
});
```

### 5. **Quick Fixes to Try**

#### Fix 1: Restart Everything
1. Stop your backend server (Ctrl+C)
2. Restart backend: `npm run start:dev`
3. Rebuild Android app in Android Studio
4. Reinstall app on device/emulator

#### Fix 2: Clear App Data
1. Go to Android Settings > Apps > Your App
2. Clear storage/cache
3. Force stop the app
4. Restart the app

#### Fix 3: Test with Simple Request
Add a simple test button in your app to make a basic HTTP request:

```typescript
// In any component
testConnection() {
  this.http.get('http://192.168.50.193:8080/api/v1/').subscribe(
    response => console.log('✅ Connection successful:', response),
    error => console.error('❌ Connection failed:', error)
  );
}
```

### 6. **Network-Specific Issues**

#### If Using Emulator:
- Emulator might have different network configuration
- Try using `10.0.2.2` for localhost on emulator

#### If Using Physical Device:
- Ensure device is on same WiFi network as server
- Check if firewall is blocking the connection
- Try turning WiFi off/on on the device

### 7. **Next Steps**

1. **Test from mobile browser first** - this isolates the issue
2. **Check Android Studio logs** for specific error messages
3. **Verify CORS configuration** on the server
4. **Test with simple HTTP request** before complex API calls

## Expected Behavior When Fixed

- ✅ Mobile browser can access `http://192.168.50.193:8080/api/v1/`
- ✅ Android app can make successful API calls
- ✅ Authorization headers are included in requests
- ✅ No CORS errors in Android Studio logs
- ✅ Backend receives and processes requests normally

If you're still having issues after trying these steps, please share:
1. The exact error message from Android Studio logs
2. What happens when you test from mobile browser
3. Any specific API endpoint that's failing
