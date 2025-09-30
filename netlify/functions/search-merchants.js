const fetch = require('node-fetch');
const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const { latitude, longitude, radius } = JSON.parse(event.body);

  // API credentials from environment variables
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

  // Construct request for location-based search (using city approx from lat/long; adjust as needed)
  // Note: For precise geo, use merchantZip or test with known merchants like "Starbucks"
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
      // Approximate city from lat/long (hardcode for SF test; in prod, reverse geocode)
      merchantName: 'Starbucks',  // Fallback/test merchant
      merchantCity: 'San Francisco',
      merchantCountryCode: 'USA',
      // Add lat/long if supported: merchantLatitude: latitude.toString(), merchantLongitude: longitude.toString()
    },
    searchOptions: {
      maxRecords: '5',
      matchIndicators: 'true',
      matchScore: 'true'
    }
  });

  // Generate X-Pay-Token
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = timestamp + resourcePath + queryString + requestBody;
  const hash = crypto.createHmac('sha256', sharedSecret).update(message).digest('hex');
  const xPayToken = `xv2:${timestamp}:${hash}`;

  console.log('Request URL:', `${baseUrl}/${resourcePath}?${queryString}`);
  console.log('X-Pay-Token (first 20 chars):', xPayToken.substring(0, 20) + '...');
  console.log('Request Body Preview:', JSON.stringify(requestBody).substring(0, 200) + '...');

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

    const responseText = await response.text();  // Get raw text for logging
    console.log('Visa Response Status:', response.status);
    console.log('Visa Response Body:', responseText);

    if (!response.ok) {
      throw new Error(`Visa API error: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    // Adjust based on actual response: often { merchants: [...] } or { response: { searchResultRecords: [...] } }
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