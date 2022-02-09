/**
 * A Lambda function that returns a string.
 */
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.updateStoreDetailData = async (request) => {
  try {
    const { storeID } = request.pathParameters;
    const { storeAddress, menus } = JSON.parse(request.body);

    console.log(request, menus);

    const getParams = {
      TableName: "42chelin-stores",
      Key: {
        storeID: storeID,
        storeAddress: storeAddress,
      },
    };

    console.log("여기", getParams);
    const getResult = await dynamodb.get(getParams).promise();

    if (Object.keys(getResult).length !== 0) {
      const updateParams = {
        TableName: "42chelin-stores",
        Key: {
          storeID: storeID,
          storeAddress: storeAddress,
        },
        UpdateExpression: "set #menus = :new_menus",
        ExpressionAttributeNames: {
          "#menus": "storeMenus",
        },
        ExpressionAttributeValues: {
          ":new_menus": menus,
        },
      };
      console.log(updateParams);
      await dynamodb.update(updateParams).promise();
    } else {
      throw new Error("Cannot find store");
    }

    return {
      statusCode: 200,
      body: "",
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
