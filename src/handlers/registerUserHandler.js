/**
 * A Lambda function that returns a string.
 */
const axios = require("axios");
const client = axios.create();
const bcrypt = require("bcryptjs");
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

const saltRounds = 8;

exports.registerUser = async (event, context) => {
  try {
    console.log(event);
    const { code, password, email } = JSON.parse(event.body);
    const res = await client.post("https://api.intra.42.fr/oauth/token", {
      grant_type: "authorization_code",
      client_id: "~",
      client_secret: "~",
      code: code,
      redirect_uri: "https://42chelin.shop/register",
    });

    const info42 = await client.get("https://api.intra.42.fr/v2/me", {
      headers: {
        "Authorization": "Bearer " + res.data.access_token,
      },
    });

    const clusterName = info42.data.login;

    const getParams = {
      TableName: "42chelin-users",
      Key: {
        clusterName: clusterName,
      },
    };
    const getResult = await dynamodb.get(getParams).promise();

    if (Object.keys(getResult).length !== 0) {
      throw new Error("Duplicated User");
    }

    const encryptedPassword = bcrypt.hashSync(password, saltRounds);
    console.log(encryptedPassword);
    const putParams = {
      TableName: "42chelin-users",
      Item: {
        clusterName: clusterName,
        password: encryptedPassword,
        email: email,
        storeReviews: [],
        storeLikes: [],
      },
    };
    await dynamodb.put(putParams).promise();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (error) {
    console.error(error);
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

exports.registerUserTest = async (event, context) => {
  try {
    console.log(event);
    const { code, password, email } = JSON.parse(event.body);
    const res = await client.post("https://api.intra.42.fr/oauth/token", {
      grant_type: "authorization_code",
      client_id: "~",
      client_secret: "~",
      code: code,
      redirect_uri: "http://localhost:3000/register",
    });
    const info42 = await client.get("https://api.intra.42.fr/v2/me", {
      headers: {
        "Authorization": "Bearer " + res.data.access_token,
      },
    });
    const clusterName = info42.data.login;
    console.log(clusterName);

    const getParams = {
      TableName: "42chelin-users",
      Key: {
        clusterName: clusterName,
      },
    };
    console.log(getParams);

    const getResult = await dynamodb.get(getParams).promise();
    if (Object.keys(getResult).length !== 0) {
      throw new Error("Duplicated User");
    }

    const encryptedPassword = bcrypt.hashSync(password, saltRounds);
    console.log(encryptedPassword);
    const putParams = {
      TableName: "42chelin-users",
      Item: {
        email: email,
        clusterName: clusterName,
        password: encryptedPassword,
        storeReviews: [],
        storeLikes: [],
      },
    };
    console.log(putParams);
    await dynamodb.put(putParams).promise();

    return {
      statusCode: 200,
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
