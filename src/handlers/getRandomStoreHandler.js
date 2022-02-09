/**
 * A Lambda function that returns a string.
 */
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.getRandomStore = async () => {
  try {
    var params = {
      TableName: "42chelin-stores",
      FilterExpression: "contains(#storeAddress, :address) and #storeCategory = :category",
      ExpressionAttributeNames: {
        "#storeAddress": "storeAddress",
        "#storeCategory": "storeCategory",
      },
      ExpressionAttributeValues: {
        ":address": "서울 강남구",
        ":category": "FD6",
      },
    };

    const getResult = await dynamodb.scan(params).promise();
    if (getResult.Items.length === 0) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    }

    const filteredResult = getResult.Items[Math.floor(Math.random() * getResult.Items.length)];

    console.log(getResult);

    return {
      statusCode: 200,
      body: JSON.stringify({
        storeID: filteredResult.storeID,
        storeName: filteredResult.storeName,
        storeAddress: filteredResult.storeAddress,
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
