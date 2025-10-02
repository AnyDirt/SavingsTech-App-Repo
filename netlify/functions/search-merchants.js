const fetch = require('node-fetch');
const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*', 'X-Content-Type-Options': 'nosniff' },
      body: 'Method not allowed'
    };
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
      headers: { 'Access-Control-Allow-Origin': '*', 'X-Content-Type-Options': 'nosniff' },
      body: JSON.stringify({ error: 'Missing API credentials' })
    };
  }

  // Construct request per Visa Merchant Search API spec
  const resourcePath = 'merchantsearch/v1/locator';
  const queryString = `apikey=${apiKey}`;
  const currentTime = new Date().toISOString();
  const requestBody = JSON.stringify({
    header: {
      messageDateTime: currentTime,
      requestMessageId: Date.now().toString()
    },
    searchOptions: {
      matchScore: "true",
      maxRecords: "5",
      matchIndicators: "true"
    },
    searchAttrList: {
      latitude: latitude,
      longitude: longitude,
      distance: Math.ceil(radius / 1609.34).toString(), // Convert meters to miles, as string
      distanceUnit: "m" // "m" for miles; use "k" for km if preferred
    },
    responseAttrList: ["GNLOCATOR"]
  }, null, 0); // No whitespace

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
    console.log('Visa Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      throw new Error(`Visa API error: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    if (data.responseStatus?.code !== 'API000') {
      throw new Error(`Visa API status error: ${data.responseStatus.code} - ${data.responseStatus.message}`);
    }

    // Parse merchants per API spec
    const apiResponse = data.responseData?.response || [];
    const merchants = apiResponse.map(item => {
      const values = item.responseValues || {};
      return {
        merchantName: values.visaMerchantName || values.merchantName || 'Unknown',
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
    }).sort((a, b) => a.distance - b.distance); // Ensure sorted by distance

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      },
      body: JSON.stringify({ merchants })
    };
  } catch (error) {
    console.error('Full Error:', error.message);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'X-Content-Type-Options': 'nosniff' },
      body: JSON.stringify({ error: error.message })
    };
  }
};