/**
 * A Lambda function that returns a string.
 */
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();
const bcrypt = require("bcryptjs");

const saltRounds = 8;

exports.changePassword = async (event) => {
  try {
    const { clusterName } = event.pathParameters;
    const { prevPassword, currPassword } = JSON.parse(event.body);

    const getParams = {
      TableName: "42chelin-users",
      Key: {
        clusterName: clusterName,
      },
    };
    const getResult = await dynamodb.get(getParams).promise();

    console.log(getResult);

    if (!getResult.Item) {
      throw new Error("No user");
    } else {
      const match = await bcrypt.compare(prevPassword, getResult.Item.password);
      console.log(match);
      if (!match) throw new Error("Password does not match.");

      const updateParams = {
        TableName: "42chelin-users",
        Key: {
          clusterName: clusterName,
        },
        UpdateExpression: "set #password = :new_password",
        ExpressionAttributeNames: {
          "#password": "password",
        },
        ExpressionAttributeValues: {
          ":new_password": bcrypt.hashSync(currPassword, saltRounds),
        },
      };
      await dynamodb.update(updateParams).promise();
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    }
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
