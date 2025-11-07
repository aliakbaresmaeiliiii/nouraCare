const https = require('https');
const fs = require('fs');

// Read the certificate files
const options = {
  key: fs.readFileSync('./certs/key.pem'),
  cert: fs.readFileSync('./certs/cert.pem'),
  rejectUnauthorized: false // For self-signed certificates
};

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
  hostname: 'localhost',
  port: 8080,
  path: '/api/v1/onboarding/save',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  },
  ...options
}, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
    console.log('✅ Onboarding endpoint is working correctly!');
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.on('timeout', () => {
  console.error('❌ Request timed out');
  req.destroy();
});

// Set timeout to 10 seconds
req.setTimeout(10000);

req.write(data);
req.end();
