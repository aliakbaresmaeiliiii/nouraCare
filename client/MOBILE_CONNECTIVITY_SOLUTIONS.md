# Mobile App Connectivity Issues - Solutions

## Identified Issues and Solutions

### 1. **Network Security Configuration Issue**
**Problem**: The current network security config only allows `10.134.83.186` and `localhost`, but your server IP might be changing.

**Solution**: Update the network security config to be more permissive:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.134.83.186</domain>
        <domain includeSubdomains="true">10.51.190.186</domain>
        <domain includeSubdomains="true">192.168.50.193</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

### 2. **Environment Configuration Issue**
**Problem**: Hardcoded IP addresses that may change.

**Solution**: Use a domain name or implement dynamic IP detection:

```typescript
// src/environments/environment.mobile.ts
export const environment = {
  production: false,
  // Use your actual domain or implement IP detection
  apiEndPoint: 'http://your-server-domain.com:8080/api/v1/',
  urlProfileImg: 'http://your-server-domain.com:8080/uploads/',
};
```

### 3. **Android Build Configuration**
**Solution**: Ensure you rebuild the Android app after environment changes:

```bash
# Rebuild the web app
npm run build

# Sync with Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android

# Then build from Android Studio
```

### 4. **Network Testing Steps**

1. **Test Server Connectivity**:
   ```bash
   # From your development machine
   ping 10.134.83.186
   curl http://10.134.83.186:8080/api/v1/health
   ```

2. **Check if server is accessible from mobile network**:
   - Ensure server and mobile are on same network
   - Check firewall settings on server
   - Verify port 8080 is open

### 5. **Debugging Steps**

1. **Enable Debug Logging**:
   ```typescript
   // Add to your HTTP interceptor
   console.log('Making request to:', req.url);
   console.log('Full URL:', environment.apiEndPoint + req.url);
   ```

2. **Check Console Logs**:
   - Use Chrome DevTools with `chrome://inspect`
   - Check for CORS errors
   - Look for network request failures

### 6. **Alternative Solutions**

**Option A: Use HTTPS**
- Set up SSL certificate on your server
- Update environment to use HTTPS
- Remove cleartext traffic permissions

**Option B: Use a Public Domain**
- Set up a domain name pointing to your server
- Use Cloudflare or similar service
- More reliable than IP addresses

### 7. **Quick Fix - Update Network Security Config**

Apply this immediate fix to your network security config:

<replace_in_file>
<path>android/app/src/main/res/xml/network_security_config.xml</path>
<diff>
------- SEARCH
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.134.83.186</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
=======
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.134.83.186</domain>
        <domain includeSubdomains="true">10.51.190.186</domain>
        <domain includeSubdomains="true">192.168.50.193</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
+++++++ REPLACE
</diff>
</write_to_file>
