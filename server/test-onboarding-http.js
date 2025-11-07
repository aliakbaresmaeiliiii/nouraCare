const http = require('http');

const onboardingData = {
  pregnancy_status: 'tracking',
  last_period: '2025-10-01',
  cycle_length: 28,
  period_length: 5,
  health_goals: '["weight_management", "fertility_tracking"]',
  notifications: true
};

const data = JSON.stringify(onboardingData);

console.log('Testing HTTP connection to 192.168.50.193:8080...');

const options = {
  hostname: '192.168.50.193',
  port: 8080,
  path: '/api/v1/onboarding/save',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
    console.log('✅ HTTP connection working!');
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log('💡 Make sure:');
  console.log('   - Server is running on 192.168.50.193:8080');
  console.log('   - Firewall allows port 8080');
});

req.on('timeout', () => {
  console.error('❌ Request timed out');
  req.destroy();
});

// Set timeout to 10 seconds
req.setTimeout(10000);

req.write(data);
req.end();
