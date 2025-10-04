const https = require('https');
const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Method not allowed'
    };
  }

  const { latitude, longitude, radius } = JSON.parse(event.body);

  // Read certificates from files
  const cert = fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem'), 'utf-8');
  const key = fs.readFileSync(path.join(__dirname, 'certs', 'key.pem'), 'utf-8');
  const userId = process.env.VISA_USER_ID;
  const password = process.env.VISA_PASSWORD;

  const requestBody = JSON.stringify({
    header: {
      messageDateTime: new Date().toISOString(),
      requestMessageId: Date.now().toString()
    },
    searchOptions: {
      matchScore: "true",
      maxRecords: "5",
      matchIndicators: "true"
    },
    searchAttrList: {
      latitude: latitude || 37.7749,
      longitude: longitude || -122.4194,
      distance: Math.ceil((radius || 15000) / 1609.34).toString(),
      distanceUnit: "m"
    },
    responseAttrList: ["GNLOCATOR"]
  });

  const options = {
    hostname: 'sandbox.api.visa.com',
    port: 443,
    path: '/merchantsearch/v1/locator',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody)
    },
    cert: cert,
    key: key,
    auth: `${userId}:${password}`
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Response:', data);
        
        if (res.statusCode !== 200) {
          resolve({
            statusCode: res.statusCode,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: data })
          });
          return;
        }

        const parsed = JSON.parse(data);
        const apiResponse = parsed.responseData?.response || [];
        const merchants = apiResponse.map(item => {
          const values = item.responseValues || {};
          return {
            merchantName: values.visaMerchantName || 'Unknown',
            address: {
              line1: values.merchantStreetAddress || '',
              city: values.merchantCity || '',
              country: values.merchantCountryCode || '',
              postalCode: values.merchantPostalCode || ''
            },
            distance: parseFloat((values.distance || '0').replace(/ mi$/, '')) || 0,
            phoneNumber: values.merchantPhoneNumber || 'N/A',
            latitude: parseFloat(values.locationAddressLatitude) || 0,
            longitude: parseFloat(values.locationAddressLongitude) || 0
          };
        }).sort((a, b) => a.distance - b.distance);

        resolve({
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ merchants })
        });
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error);
      resolve({
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: error.message })
      });
    });

    req.write(requestBody);
    req.end();
  });
};