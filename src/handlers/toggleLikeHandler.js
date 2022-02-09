const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda({
  region: "ap-northeast-2", //change to your region
});

exports.toggleLike = async (event) => {
  try {
    const { storeID } = event.pathParameters;
    const { clusterName, isLike } = JSON.parse(event.body);
    let resultBody = {};

    const getParams = {
      TableName: "42chelin-stores",
      KeyConditionExpression: "#ID = :id",
      ExpressionAttributeNames: {
        "#ID": "storeID",
      },
      ExpressionAttributeValues: {
        ":id": storeID,
      },
    };
    const queryResult = await dynamodb.query(getParams).promise();

    if (Object.keys(queryResult.Items).length !== 0) {
      const store = queryResult.Items[0];
      if (isLike) {
        console.log("like", store.storeLikes);
        if (store.storeLikes.includes(clusterName)) {
          resultBody = { status: false, likes: store.storeLikes.length };
        } else {
          const updateParams = {
            TableName: "42chelin-stores",
            Key: {
              storeID: store.storeID,
              storeAddress: store.storeAddress,
            },
            UpdateExpression: "set #likes = list_append(if_not_exists(#likes, :empty_list), :user_likes)",
            ExpressionAttributeNames: {
              "#likes": "storeLikes",
            },
            ExpressionAttributeValues: {
              ":user_likes": [clusterName],
              ":empty_list": [],
            },
          };
          await dynamodb.update(updateParams).promise();

          const updateUserParams = {
            TableName: "42chelin-users",
            Key: { clusterName },
            UpdateExpression: "set #likes = list_append(if_not_exists(#likes, :empty_list), :user_likes)",
            ExpressionAttributeNames: {
              "#likes": "storeLikes",
            },
            ExpressionAttributeValues: {
              ":user_likes": [
                {
                  storeID,
                  storeName: store.storeName,
                  storeCategoryName: store.storeCategoryName,
                  storeAddress: store.storeAddress,
                },
              ],
              ":empty_list": [],
            },
          };
          await dynamodb.update(updateUserParams).promise();

          resultBody = {
            status: true,
            likes: store.storeLikes.length + 1,
          };
        }
      } else {
        console.log("dislike", store.storeLikes);
        if (!store.storeLikes.includes(clusterName)) {
          resultBody = {
            status: false,
            likes: store.storeLikes.length,
          };
        } else {
          const updateParams = {
            TableName: "42chelin-stores",
            Key: {
              storeID: store.storeID,
              storeAddress: store.storeAddress,
            },
            UpdateExpression: "set #likes = :user_likes",
            ExpressionAttributeNames: {
              "#likes": "storeLikes",
            },
            ExpressionAttributeValues: {
              ":user_likes": store.storeLikes.filter((x) => x !== clusterName),
            },
          };
          await dynamodb.update(updateParams).promise();

          const getUserParams = {
            TableName: "42chelin-users",
            AttributesToGet: ["storeLikes"],
            Key: { clusterName },
          };

          const userLikes = await dynamodb.get(getUserParams).promise();
          console.log(userLikes);
          const storeIndex = userLikes.Item.storeLikes.findIndex((store) => store.storeID === storeID);

          const updateUserParams = {
            TableName: "42chelin-users",
            Key: { clusterName },
            UpdateExpression: "remove #likes[" + storeIndex + "]",
            ExpressionAttributeNames: {
              "#likes": "storeLikes",
            },
          };
          console.log("update", updateUserParams);
          await dynamodb.update(updateUserParams).promise();

          resultBody = {
            status: true,
            likes: store.storeLikes.length - 1,
          };
        }
      }
    } else {
      resultBody = {
        status: false,
        likes: store.storeLikes.length,
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(resultBody),
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
