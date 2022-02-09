/**
 * A Lambda function that returns a string.
 */
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.getStoreDataMap = async (event) => {
  try {
    let result = [];
    let lastEvaluatedKey = null;

    do {
      const params = {
        TableName: "42chelin-stores",
        AttributesToGet: ["storeID", "storeName", "storeAddress", "storeLocation"],
        ExclusiveStartKey: lastEvaluatedKey,
      };

      const getResult = await dynamodb.scan(params).promise();
      result = [...result, ...getResult.Items];
      console.log("result", result, getResult.Items);
    } while (lastEvaluatedKey);

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: result,
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
