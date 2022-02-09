/**
 * A Lambda function that returns a string.
 */
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();
const jwt = require("jsonwebtoken");

exports.refreshToken = async (event, context) => {
  try {
    const refreshToken = JSON.parse(event.body).refresh_token;
    const accessToken = event.headers.Authorization.split(" ")[1];
    const clusterName = event.pathParameters.clusterName;

    console.log(refreshToken, accessToken);

    try {
      const decode = jwt.verify(accessToken, process.env.secret_key);
      if (decode.clusterName !== clusterName) throw new Error("There is a problem with the access token.");
    } catch (err) {
      if (err.name !== "TokenExpiredError") {
        console.log(err);
        throw new Error("There is a problem with the access token.");
      }
    }

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

    if (refreshResult.Items.length === 0) {
      throw new Error("There is a problem with the refresh token.");
    } else {
      const createdAccessToken = jwt.sign(
        {
          clusterName: clusterName,
          exp: Math.floor(Date.now() / 1000) + 60 * 15,
        },
        process.env.secret_key
      );

      let createdRefreshToken = refreshResult.Items[refreshResult.Items.length - 1].refreshToken;
      console.log("refresh_token", createdRefreshToken, refreshToken, refreshToken === createdRefreshToken);
      if (refreshToken !== createdRefreshToken) {
        throw new Error("Refresh token is not valid");
      }
      if (refreshResult.Items[0].timeToLive - Date.now() / 1000 <= 60 * 15) {
        console.log("new refresh created", refreshResult.Items[0].timeToLive, Date.now() / 1000);
        createdRefreshToken = Math.random().toString(18).slice(2);
        console.log("new refresh ", createdRefreshToken, Date.now() / 1000);
        const putRefreshTokenParams = {
          TableName: "42chelin-tokens",
          Item: {
            clusterName: clusterName,
            issueDate: new Date(Date.now()).toUTCString(),
            refreshToken: createdRefreshToken,
            timeToLive: Date.now() / 1000 + 60 * 60 * 24 * 7, //ms가 아닌 s단위
          },
        };
        await dynamodb.put(putRefreshTokenParams).promise();
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          access_token: createdAccessToken,
          refresh_token: createdRefreshToken,
        }),
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
