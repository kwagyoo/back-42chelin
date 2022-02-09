/**
 * A Lambda function that returns a string.
 */
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();
const jwt = require("jsonwebtoken");

exports.getStoreDetailData = async (event) => {
  try {
    const { storeID } = event.pathParameters;
    const { storeAddress } = event.queryStringParameters;
    let clusterName = "";
    if (event.headers.Authorization) {
      const token = event.headers.Authorization.split(" ")[1];
      clusterName = jwt.decode(token).clusterName;
    }

    var params = {
      TableName: "42chelin-stores",
      KeyConditionExpression: "storeID= :id and storeAddress= :address",
      ExpressionAttributeValues: {
        ":id": storeID,
        ":address": storeAddress,
      },
    };
    const getResult = await dynamodb.query(params).promise();
    if (getResult.Items.length === 0) return { body: [] };
    const parseReviews = getResult.Items[0].storeReviews.map((x) => {
      const parseReview = JSON.parse(x);
      return { ...parseReview, images: JSON.parse(parseReview.images) };
    });

    console.log(getResult);
    console.log(getResult.Items[0].storeLikes);
    const returnValue = {
      ...getResult.Items[0],
      storeMenus: getResult.Items[0].storeMenus ?? [],
      storeReviews: parseReviews,
      storeLikes: getResult.Items[0].storeLikes.length,
      isLike: getResult.Items[0].storeLikes.includes(clusterName),
    };
    console.log(returnValue);

    return {
      statusCode: 200,
      body: JSON.stringify(returnValue),
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
