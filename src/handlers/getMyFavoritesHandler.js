/**
 * A Lambda function that returns a string.
 */
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();
let s3 = new AWS.S3({ region: "ap-northeast-2" });

exports.getMyFavorites = async (event) => {
  try {
    const { clusterName } = event.pathParameters;

    const getParams = {
      TableName: "42chelin-users",
      Key: { clusterName: clusterName },
    };
    const getResult = await dynamodb.get(getParams).promise();

    if (!getResult.Item) {
      throw new Error("Cannot find user");
    }

    const storeLikes = getResult.Item.storeLikes;
    console.log(storeLikes);
    const likesIncludeThumb = await Promise.all(
      storeLikes.map(async (store) => {
        var params = {
          Bucket: "42chelin-images" /* required */,
          Prefix: `w_300/${store.storeID}/`, // Can be your folder name
        };
        const list = await s3.listObjectsV2(params).promise();
        console.log(list);
        if (!list.Contents.length) return store;
        return { ...store, images: list.Contents[Math.floor(Math.random() * list.Contents.length)].Key.slice(6) };
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(likesIncludeThumb),
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
