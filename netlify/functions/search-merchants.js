const https = require('https');

// Embedded certificates (base64 encoded)
const CERT_BASE64 = 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUQzakNDQXNhZ0F3SUJBZ0lJY0NpT2dtaS9rT2d3RFFZSktvWklodmNOQVFFTEJRQXdVVEVMTUFrR0ExVUUKQmhNQ1ZWTXhIVEFiQmdOVkJBb01GRVJsZG1Wc2IzQnRaVzUwSUZCc1lYUm1iM0p0TVNNd0lRWURWUVFEREJwUQpZWGx0Wlc1MElGTmhibVJpYjNnZ1NYTnpkV2x1WnlCRFFUQWVGdzB5TlRFd01EUXlNRFF4TlRCYUZ3MHlOakV3Ck1EUXlNRFF4TkRsYU1JR1ZNU2t3SndZSktvWklodmNOQVFrQkZocHlMbWR5WldWdVpVQm5iRzlpWVd4bWFXNWwKYzNObExtTnZiVEVRTUE0R0ExVUVBd3dIVW1samFHRnlaREVUTUJFR0ExVUVDd3dLUkdWd1lYSjBiV1Z1ZERFVgpNQk1HQTFVRUNnd01UM0puWVc1cGVtRjBhVzl1TVEwd0N3WURWUVFIREFSRGFYUjVNUTR3REFZRFZRUUlEQVZUCmRHRjBaVEVMTUFrR0ExVUVCaE1DVlZNd2dnRWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUJEd0F3Z2dFS0FvSUIKQVFDdnVqSjU2ZXJGeElwWFJJMThDc1EySmRWaXdPSmpLL2FxZkYxKzRHb0VOVlhZa2FlRDdwVHh6ZUFpWHlSOQpYeDl1Y0lLU1Rld0czT09ySk5mZkxPU0k5QTBCNU9QTFRnWVZRd2pzMFEyd1B0dGRYbmJIcGxyc2diamxZcE1UCi9Jek0wVEUwL1lZYzdaSCtLa09SVWRXNlYzSjJicXBWRGhFVTljVHZzU0lmSEhtYzJYa2VhcDBVdnJnb0ZCSVcKQXZxeEpUbUlRU3hMREd4Yng4dy9iOGJ0NnhoUjFtaWFjaHZzUjR3anJGK2o0MkVCN2xhdEVGSzYvSEdwNk91cwppaGxzSlVQVkNtNG5uTnU5VG4rdXd5Um0vemV4cjdMR3ByNWxMMndhYWcwWCszN0hWN2xCaDlKMFVPMGk1eUc2CnFmc3VuL0Jueloyd2VZbmI3VnlQT1BxdEFnTUJBQUdqZFRCek1Bd0dBMVVkRXdFQi93UUNNQUF3SHdZRFZSMGoKQkJnd0ZvQVV2bTVDQmVaVnh1ZDV6Vm1HOVZHSGZ4WVJBRGt3RXdZRFZSMGxCQXd3Q2dZSUt3WUJCUVVIQXdJdwpIUVlEVlIwT0JCWUVGRmhMZHRadVFBUVdLYnBoOERsbDFNSDNwdEMrTUE0R0ExVWREd0VCL3dRRUF3SUY0REFOCkJna3Foa2lHOXcwQkFRc0ZBQU9DQVFFQVQ1NlVtU2d3K1RXNGIwaURueXY5S2tTaTNRSFEvSVZCSzA4K3N4b1oKZXF0dlhja0ljODJUMDN6TW9haU5HRVg2MGp4Y2pJWVdnMkhuUU1LTm9YVjUwTVZ6bHh2REM2WE52c2ZldDE4Mwp5dEdMSE95N3BjUTZJcWQxbithSGhTd05jRUd6M01HYnpMSitDMEdLblhuNEdHTmk0RDU4ZkhqSkZ0ZC9paUNECmF3T3JoRHV5OVNnVVp3cVE3RGtFdVQxWlAzVVp6TUlzVzhkRnFrb1g1cWV2ZDZITVFOZWVJU2F0YnZXZmtEQVcKQTBQemR1TDJTSkppWW5FT1NFMjhHVWdLV0M2ekFQK0Zldm54TmVUcE5qN1ljL05WbXdiQU8rOVo5U2IxUWE5RApKc2dXamRURmVqUS9GY2pzRHdXVTZHVCtsWS9tVm81cDEyUmNrNGtjRGtDMzBBPT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQ==';

const KEY_BASE64 = 'LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb3dJQkFBS0NBUUVBcjdveWVlbnF4Y1NLVjBTTmZBckVOaVhWWXNEaVl5djJxbnhkZnVCcUJEVlYySkduCmcrNlU4YzNnSWw4a2ZWOGZibkNDa2szc0J0empxeVRYM3l6a2lQUU5BZVRqeTA0R0ZVTUk3TkVOc0Q3YlhWNTIKeDZaYTdJRzQ1V0tURS95TXpORXhOUDJHSE8yUi9pcERrVkhWdWxkeWRtNnFWUTRSRlBYRTc3RWlIeHg1bk5sNQpIbXFkRkw2NEtCUVNGZ0w2c1NVNWlFRXNTd3hzVzhmTVAyL0c3ZXNZVWRab21uSWI3RWVNSTZ4Zm8rTmhBZTVXCnJSQlN1dnh4cWVqcnJJb1piQ1ZEMVFwdUo1emJ2VTUvcnNNa1p2ODNzYSt5eHFhK1pTOXNHbW9ORi90K3gxZTUKUVlmU2RGRHRJdWNodXFuN0xwL3daODJkc0htSjIrMWNqemo2clFJREFRQUJBb0lCQUF5UWFjajlNRS9GRW1ZVQpiUEJFUGN5b1RsWXg5ODNDNkM4KzFwbDZkcUlINVRRbmo5eFhPOWVCRW9ncW1NdU0rRXlYWjBLS0p6akRaTlRJCi9OVkVXcSt2RVZvRUVVUnBOdmFndFJ2bmc0ekpKYnFLaFVBWGxSTXBZRHlvWEY4MnRLTjFSb2tsSWtoaHRRbEEKNE5WY1RrVjFPS1llbWZlY1dwek95SzZoa2RDN0JHSlJmOTRDRm5MazUweHFzUC8xbkxVUnd2VlhVT1VLSDRmOApxbFVEVFd4TDZYa2NoWVB3N3V4WmI5YkhJL0pGSnkvSXNIcU03QWNUbkpvM2o3akl2eGpBL0Y3NkN2bGJlb210CkQwdjcwQzJFaGJNYjZYWWVqQzlmbU4wZUlMbWw3NDVBUWk4dFZWdUFvcHp4R2E1MHQvS0lZRmY1Wk5qY1hZQjMKT3ZCMktURUNnWUVBMEdKcVFpd2d6SkxWNFN6Z0FKLzhMRnNFcFRNV3Y4YnhRTzJVbld1OEE4WkZCQW1pdlQ5OQorY0FMN01udjRrVHVtQllvUXY2ZmFmNFg5RGhFcENHWlc5U1UzTndsM1FESFNXT2lQWTRFb1JMdlBpb2g1Rk40CkZQMjVSVHdSbElpOVAxajVqejdDMjNoQndHZmI5R2dhZ1R6RE4yNnFJREF5aTBra29HMC9NTDBDZ1lFQTErRjcKd2JBNWx6S2FZNHpOaG5idmdsODV1UnYyZnN5RnJKc2NuWXZQZmhDcnJaaSs4M3pOVXRtQzdEL2F6SmcvZFRZLwpESVppNUMwUHh3Zi9tbU82a0dqeGZrTU1sc0hScjB3MnlKdEJHeW9zdWo0cFBFMlJBMXptM0thSnBsNVdVUU5TCnZFdlFVQ1JrblpZSUErUzJEWlFselVxY292ckVxTlhBblFJaDZMRUNnWUFubTkxSXNLeVhWZjJ6YkYwem9UVkUKbFJSZjlrTUh0dC9ha0k0a0VmdE4yRno3OUh6cmJlc2JFc2J4Zmp6TGpJQ3hoZHluUjFDenkrbHZzVlpTd0ZRdgpJVXdlWXZZTGVQOW9VcmplN0dTeTNTOSthSEhDdlo3Z2xvMmx2RkkzSW5xZVZPSXl1U0krcHpBUVMyMkNtbHNYClg1NVhwZ0JPVi9yemdMYW1pNzFzSFFLQmdRQ3JncDNTMU5IOFdKeW1DSUJrbXV0UUZaMkRmajdJb0c1M0lraUsKdGovajlSU2Y5NkdGU3BySmZydHdQSTcxU3VQbm1IQmc0QWVESm5YSmQ0WlB2M25DTDAzbE5SbTBVRW5wemxBYgo4cFM0SXpxandLejhGdGZsNXhJWExVeGcyOFFSMnVVSmFlWVhOY0ttSEVORDdKbmlrZGV5a050KzlHSDNqTkxaCktvK01FUUtCZ0dQeHg3UkZ4eERDTHoxaEZHTWNFMFlESVJPZ1VLVXJYTGdZN3o5a3ZKQ0ViOGs0ZjJkQ01wcWkKR01WR2NWNkF4c00wMTFidituSjNmalZCK2hObnpIcDU0SSthM2FJeTVxUit3cXNtY2dOY3VOTjRUYjBFa0RwNApHbE5GamhNRVBBWUwwaW9LTnpod0Q4dnFNQWU4dXZFTENFSkNqajc1R3dXNEV1ZU1ZTktpCi0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0tCg==';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Method not allowed'
    };
  }

  const { latitude, longitude, radius } = JSON.parse(event.body);

  // Decode certificates
  const cert = Buffer.from(CERT_BASE64, 'base64').toString('utf-8');
  const key = Buffer.from(KEY_BASE64, 'base64').toString('utf-8');
  const userId = process.env.VISA_USER_ID;
  const password = process.env.VISA_PASSWORD;

  const requestBody = JSON.stringify({
    header: {
      messageDateTime: new Date().toISOString().slice(0, 23),
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