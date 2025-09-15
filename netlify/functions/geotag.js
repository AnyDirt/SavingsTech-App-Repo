// netlify/functions/geotag.js
export async function handler(event) {
  const lat = event.queryStringParameters.lat || '41.9376858';
  const lon = event.queryStringParameters.lon || '-72.7181456';
  const limit = event.queryStringParameters.limit || '10';

  const url = `https://places-api.foursquare.com/geotagging/candidates?ll=${lat},${lon}&limit=${limit}&fields=name,distance,categories`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'X-Places-Api-Version': '2025-06-17',
        authorization: `Bearer ${process.env.FSQ_API_KEY}` // keep API key safe in env
      }
    });

    const data = await res.json();

    return {
      statusCode: res.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ok: res.ok, data })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: 'fetch_failed', detail: String(err) })
    };
  }
}
