/**
 * A Lambda function that returns a string.
 */
const axios = require("axios");
const client = axios.create();
const nodemailer = require("nodemailer");
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();
const bcrypt = require("bcryptjs");

const saltRounds = 8;

exports.resetPassword = async (event) => {
  try {
    const { code } = JSON.parse(event.body);

    const res = await client.post("https://api.intra.42.fr/oauth/token", {
      grant_type: "authorization_code",
      client_id: "~",
      client_secret: "~",
      code: code,
      redirect_uri: "http://42chelin.shop/reset",
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

    console.log(getResult);

    if (!getResult.Item) {
      throw new Error("No user");
    } else {
      const randomPassword = Math.random().toString(16).slice(2);

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com", // gmail server 사용
        port: 587,
        secure: false,
        auth: {
          user: "~", //메일서버 계정
          pass: "~", //메일서버 비번
        },
      });
      let mailOptions = {
        from: "~", //보내는 사람 주소
        to: getResult.Item.email, //받는 사람 주소
        subject: "[42chelin] reset your password", //제목
        text:
          "42chelin 홈페이지에서 비밀번호 초기화를 요청 받았습니다.\n 아래의 비밀번호로 변경되었으니 로그인 후 변경해주시기 바랍니다.\n " +
          randomPassword, //본문
      };
      const mailResult = await transporter.sendMail(mailOptions);
      console.log(mailResult);

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
          ":new_password": bcrypt.hashSync(randomPassword, saltRounds),
        },
      };
      console.log(updateParams);
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
