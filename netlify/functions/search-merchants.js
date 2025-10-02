const fetch = require('node-fetch');
const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const { latitude, longitude, radius } = JSON.parse(event.body);

  // API credentials
  const apiKey = process.env.VISA_API_KEY;
  const sharedSecret = process.env.VISA_SHARED_SECRET;
  const baseUrl = process.env.VISA_BASE_URL || 'https://sandbox.api.visa.com';

  if (!apiKey || !sharedSecret) {
    console.error('Missing credentials:', { hasApiKey: !!apiKey, hasSharedSecret: !!sharedSecret });
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing API credentials' })
    };
  }

  // Construct request
  const resourcePath = 'merchantsearch/v1/search';
  const queryString = `apikey=${apiKey}`;
  const currentTime = new Date().toISOString();
  const requestBody = JSON.stringify({
    header: {
      startIndex: '0',
      requestMessageId: Date.now().toString(),
      messageDateTime: currentTime
    },
    searchAttrList: {
      merchantName: 'Starbucks', // Test with known merchant
      merchantCity: 'San Francisco',
      merchantCountryCode: 'USA'
      // Note: Lat/long not directly supported; use merchantZip or reverse geocode in prod
    },
    searchOptions: {
      maxRecords: '5',
      matchIndicators: 'true',
      matchScore: 'true'
    }
  }, null, 0); // Ensure no extra whitespace in JSON

  // Generate X-Pay-Token
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = timestamp + resourcePath + queryString + requestBody;
  const hash = crypto.createHmac('sha256', sharedSecret).update(message).digest('hex');
  const xPayToken = `xv2:${timestamp}:${hash}`;

  // Debug logs
  console.log('Request URL:', `${baseUrl}/${resourcePath}?${queryString}`);
  console.log('X-Pay-Token:', xPayToken);
  console.log('Message String:', message);
  console.log('Request Body:', requestBody);

  try {
    const response = await fetch(`${baseUrl}/${resourcePath}?${queryString}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-PAY-TOKEN': xPayToken
      },
      body: requestBody
    });

    const responseText = await response.text();
    console.log('Visa Response Status:', response.status);
    console.log('Visa Response Body:', responseText);

    if (!response.ok) {
      throw new Error(`Visa API error: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    const merchants = data.merchants || data.searchResultRecords || data.response?.searchResultRecords || [];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ merchants })
    };
  } catch (error) {
    console.error('Full Error:', error.message);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};