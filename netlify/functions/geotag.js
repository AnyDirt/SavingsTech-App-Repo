// netlify/functions/geotag.js

export async function handler(event) {
  const lat = event.queryStringParameters.lat || '41.9376858';
  const lon = event.queryStringParameters.lon || '-72.7181456';

  const url = `https://places-api.foursquare.com/geotagging/candidates?fields=name,distance,categories&ll=${lat},${lon}&limit=10`;

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'X-Places-Api-Version': '2025-06-17',
      authorization: 'Bearer IUZB2GYBKUQ3Q1P2D2AHCNRZ2QWD321AXJHH1EVT1RGGE1AC'
    }
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Allow CORS for development
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch geotagging data' })
    };
  }
}
