// Create this as serverless function to proxy the image requests from barcodelookup i.e., netlify/functions/proxyBarCodeLookupImage.js

// format for code:  url = 'your-site/.netlify/functions/proxy-image?url=${Uri.encodeComponent(imageUrl)}'

// sample: https://savingstech.netlify.app/.netlify/functions/proxyBarCodeLookupImage?url=https://images.barcodelookup.com/385/3854405-1.jpg 

const fetch = require('node-fetch');

exports.handler = async function(event) {
  const imageUrl = event.queryStringParameters.url;
  
  if (!imageUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No image URL provided' })
    };
  }
  
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400'
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch image', detail: err.message })
    };
  }
};