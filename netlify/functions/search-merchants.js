const fetch = require('node-fetch');
const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const { latitude, longitude, radius } = JSON.parse(event.body);

  const apiKey = process.env.VISA_API_KEY;
  const sharedSecret = process.env.VISA_SHARED_SECRET;
  const baseUrl = process.env.VISA_BASE_URL || 'https://sandbox.api.visa.com';

  const resourcePath = 'vdp/merchantsearch/v1/query';
  const queryString = `apikey=${apiKey}`;
  const requestBody = JSON.stringify({
    header: {
      requestMessageId: Date.now().toString(),
    },
    searchRequest: {
      criteria: {
        location: {
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        },
        radius: radius / 1000,
      },
    },
  });

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = timestamp + resourcePath + queryString + requestBody;
  const hash = crypto.createHmac('sha256', sharedSecret).update(message).digest('hex');
  const xPayToken = `xv2:${timestamp}:${hash}`;

  try {
    const response = await fetch(`${baseUrl}/${resourcePath}?${queryString}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-PAY-TOKEN': xPayToken,
      },
      body: requestBody,
    });

    if (!response.ok) {
      throw new Error(`Visa API error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    const merchants = data.response?.merchants || data.merchants || [];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ merchants }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};