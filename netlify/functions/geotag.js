// netlify/functions/geotag.js
export async function handler(event) {
  const lat = event.queryStringParameters.lat;
  const lon = event.queryStringParameters.lon;
  const limit = event.queryStringParameters.limit || '10';

  if (!lat || !lon) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: "Missing required lat/lon parameters" })
    };
  }

  const url = `https://places-api.foursquare.com/geotagging/candidates?ll=${lat},${lon}&limit=${limit}&fields=name,distance,categories`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'X-Places-Api-Version': '2025-06-17',
        authorization: `Bearer ${process.env.FSQ_API_KEY}` // stored securely in Netlify env
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
