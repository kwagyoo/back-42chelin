/**
 * A Lambda function that returns a string.
 */
const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.login = async (event) => {
  try {
    const { clusterName } = event.pathParameters;
    const { password } = event.queryStringParameters;

    const getParam = {
      TableName: "42chelin-users",
      AttributesToGet: ["password"],
      Key: {
        clusterName: clusterName,
      },
    };
    console.log("params", getParam);

    const getResult = await dynamodb.get(getParam).promise();
    if (getResult.Item === null || getResult.Item === undefined) {
      throw new Error("ID or password does not match.");
    }

    const match = await bcrypt.compare(password, getResult.Item.password);
    console.log(match);
    if (!match) throw new Error("ID or password does not match.");

    const jwtToken = jwt.sign(
      {
        clusterName: clusterName,
        exp: Math.floor(Date.now() / 1000) + 60 * 15,
      },
      process.env.secret_key
    );

    const refreshTokenParams = {
      TableName: "42chelin-tokens",
      FilterExpression: "#name = :clusterName",
      ExpressionAttributeNames: {
        "#name": "clusterName",
      },
      ExpressionAttributeValues: {
        ":clusterName": clusterName,
      },
    };

    console.log(refreshTokenParams);

    const refreshResult = await dynamodb.scan(refreshTokenParams).promise();

    let refreshToken;
    console.log(refreshResult);

    if (refreshResult.Items.length === 0) {
      refreshToken = Math.random().toString(18).slice(2);
      console.log("new refresh ", refreshToken);

      const putParams = {
        TableName: "42chelin-tokens",
        Item: {
          clusterName: clusterName,
          issueDate: new Date(Date.now()).toUTCString(),
          refreshToken: refreshToken,
          timeToLive: Date.now() / 1000 + 60 * 60 * 24 * 7, //ms가 아닌 s단위
        },
      };
      console.log("ttl", Date.now() / 1000 + 60 * 60 * 24 * 7, Date.now());
      await dynamodb.put(putParams).promise();
    } else {
      refreshToken = refreshResult.Items[refreshResult.Items.length - 1].refreshToken;
      console.log("refresh_token", refreshToken);
      if (refreshResult.Items[0].timeToLive - Date.now() / 1000 <= 60 * 15) {
        console.log("new refresh created", refreshResult.Items[0].timeToLive, Date.now() / 1000);
        refreshToken = Math.random().toString(18).slice(2);
        const putRefreshTokenParams = {
          TableName: "42chelin-tokens",
          Item: {
            clusterName: clusterName,
            issueDate: new Date(Date.now()).toUTCString(),
            refreshToken: refreshToken,
            timeToLive: Date.now() / 1000 + 60 * 60 * 24 * 7, //ms가 아닌 s단위
          },
        };
        await dynamodb.put(putRefreshTokenParams).promise();
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        access_token: jwtToken,
        refresh_token: refreshToken,
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
