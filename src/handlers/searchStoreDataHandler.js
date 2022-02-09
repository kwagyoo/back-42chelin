const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.searchStoreData = async (event) => {
  try {
    console.log(event);

    let params;
    const { storeName, lastEvaluatedKey } = event.queryStringParameters || {};

    if (storeName) {
      params = {
        TableName: "42chelin-stores",
        ScanFilter: {
          "storeName": {
            ComparisonOperator: "CONTAINS",
            AttributeValueList: [storeName],
          },
        },
        ExclusiveStartKey: lastEvaluatedKey && JSON.parse(lastEvaluatedKey),
      };
    } else {
      params = {
        TableName: "42chelin-stores",
        Limit: 12,
        ExclusiveStartKey: lastEvaluatedKey && JSON.parse(lastEvaluatedKey),
      };
    }

    const getResult = await dynamodb.scan(params).promise();
    console.log(params, getResult);
    if (getResult.Items.length === 0)
      return {
        statusCode: 200,
        body: JSON.stringify({
          body: [],
        }),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    const resultFilterThumb = getResult.Items.map(
      ({ storeID, storeName, storeAddress, storeImages, storeReviews, storeLikes, storeLocation }) => {
        return {
          storeID,
          storeName,
          storeAddress,
          storeImage: storeImages ? storeImages[Math.floor(Math.random() * storeImages.length)] : null,
          storeReviews: storeReviews.length,
          storeLikes: storeLikes.length,
          storeLocation,
        };
      }
    );
    return {
      statusCode: 200,
      body: JSON.stringify({
        body: resultFilterThumb,
        LastEvaluatedKey: getResult.LastEvaluatedKey ? JSON.stringify(getResult.LastEvaluatedKey) : undefined,
      }),
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (error) {
    console.log(error);
    if (error.response) {
      return {
        statusCode: error.response.status,
        body: JSON.stringify({
          errorMessage: error.response.data.message,
        }),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    } else if (error.request) {
      return {
        statusCode: 400,
        body: JSON.stringify({ errorMessage: error.request }),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    } else if (error.message) {
      // 오류를 발생시킨 요청을 설정하는 중에 문제가 발생했습니다.
      return {
        statusCode: 500,
        body: JSON.stringify({ errorMessage: error.message }),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ errorMessage: error }),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    }
  }
};
