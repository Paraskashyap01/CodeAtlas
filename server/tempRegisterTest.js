import http from 'http';

const data = JSON.stringify({ email: `newtestuser${Date.now()}@example.com`, password: 'Password123' });
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('BODY', body);
  });
});

req.on('error', (err) => console.error('ERR', err.message));
req.write(data);
req.end();
