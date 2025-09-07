const https = require('https');
const http = require('http');

const testPdfUrl = 'https://res.cloudinary.com/dxtfnvxmz/image/upload/v1757271190/lyvo-properties/rcakfpmy1k4dgncxzg7w.pdf?f_pdf';

console.log('Testing PDF URL:', testPdfUrl);

const client = testPdfUrl.startsWith('https') ? https : http;

const req = client.request(testPdfUrl, { method: 'HEAD' }, (res) => {
  console.log('Response status:', res.statusCode);
  console.log('Response headers:', res.headers);
  
  if (res.statusCode === 200) {
    console.log('✅ PDF URL is accessible');
    console.log('Content-Type:', res.headers['content-type']);
    console.log('Content-Length:', res.headers['content-length']);
  } else {
    console.log('❌ PDF URL returned status:', res.statusCode);
  }
});

req.on('error', (error) => {
  console.error('❌ Error accessing PDF URL:', error.message);
});

req.end();
