const fetch = require('node-fetch');

exports.handler = async function(event) {
  const barcode = event.queryStringParameters.barcode;
  const API_KEY = '5prbr5wrkq42tdr3b9eu16tqt7ar1s';
  const url = `https://api.barcodelookup.com/v3/products?barcode=${barcode}&formatted=y&key=${API_KEY}`;
  //const url = `https://api.barcodelookup.com/v3/products?barcode=888412057566&formatted=y&key=5prbr5wrkq42tdr3b9eu16tqt7ar1s`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Barcode API failed', detail: err.message }),
    };
  }
};
