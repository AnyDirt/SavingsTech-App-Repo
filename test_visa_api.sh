#!/bin/bash
API_KEY="8QUJIXF7J47L21FOQP9321IauyBDW7PjMrGRpMz-mpgbNGJK0"
SHARED_SECRET="}D0q6UbwDAY7KY+eY$6DJ#IxCWmeWJGC0ryK$QTx"
TIMESTAMP=$(date +%s)
RESOURCE_PATH="merchantsearch/v1/locator"
QUERY_STRING="apikey=$API_KEY"
CURRENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
REQUEST_BODY='{"header":{"messageDateTime":"'"$CURRENT_TIME"'","requestMessageId":"'"$(date +%s)"'"},"searchOptions":{"matchScore":"true","maxRecords":"5","matchIndicators":"true"},"searchAttrList":{"latitude":37.7749,"longitude":-122.4194,"distance":"4","distanceUnit":"m"},"responseAttrList":["GNLOCATOR"]}'
MESSAGE="${TIMESTAMP}${RESOURCE_PATH}${QUERY_STRING}${REQUEST_BODY}"
HASH=$(echo -n "$MESSAGE" | openssl dgst -sha256 -hmac "$SHARED_SECRET" | awk '{print $2}')
X_PAY_TOKEN="xv2:${TIMESTAMP}:${HASH}"

# Redirect all output (stdout and stderr) to curl_detailed_output.txt
{
  echo "API Key: $API_KEY"
  echo "Shared Secret (first 5 chars): ${SHARED_SECRET:0:5}"
  echo "Timestamp: $TIMESTAMP"
  echo "Resource Path: $RESOURCE_PATH"
  echo "Query String: $QUERY_STRING"
  echo "Request Body: $REQUEST_BODY"
  echo "Message String: $MESSAGE"
  echo "X-Pay-Token: $X_PAY_TOKEN"
  curl -X POST "https://sandbox.api.visa.com/merchantsearch/v1/locator?${QUERY_STRING}" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -H "X-PAY-TOKEN: ${X_PAY_TOKEN}" \
    -d "$REQUEST_BODY" \
    -v
} > curl_detailed_output.txt 2>&1