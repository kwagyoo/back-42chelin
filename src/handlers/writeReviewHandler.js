/**
 * A Lambda function that returns a string.
 */
const fetch = require("node-fetch");
const AWS = require("aws-sdk");
const lambda = new AWS.Lambda({
  region: "ap-northeast-2", //change to your region
});
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.writeReview = async (event) => {
  try {
    console.log(event);

    const { storeID } = event.pathParameters;
    const {
      storeName,
      storeAddress,
      storeCategory,
      storeCategoryName,
      storePhoneNumber,
      reviewDate,
      reviewText,
      clusterName,
      images,
      x,
      y,
      menus,
    } = JSON.parse(event.body);

    if (!(storeID && storeAddress && clusterName && reviewText && reviewDate))
      throw new Error("There is not enough data for review");

    const getParams = {
      TableName: "42chelin-stores",
      Key: {
        storeID: storeID,
        storeAddress: storeAddress,
      },
    };

    const getResult = await dynamodb.get(getParams).promise();

    if (Object.keys(getResult).length !== 0) {
      const reviews = getResult.Item.storeReviews;

      reviews.forEach((review) => {
        const parsedReview = JSON.parse(review);
        console.log(review);
        if (parsedReview.clusterName === clusterName && parsedReview.reviewDate === reviewDate) {
          throw new Error("Cannot post two reviews in one day.");
        }
      });

      const prevMenus = getResult.Item.storeMenus ?? [];
      const uncommonMenus = prevMenus.filter((prevItem) => !Object.keys(menus).includes(prevItem.name)); //prevMenus 기준으로 menus와 안겹치는 메뉴들
      console.log(uncommonMenus);
      let newMenus = uncommonMenus.concat(menus);
      newMenus = newMenus ?? undefined;

      const updateParams = {
        TableName: "42chelin-stores",
        Key: {
          storeID: storeID,
          storeAddress: storeAddress,
        },
        UpdateExpression:
          "set #reviews = list_append(if_not_exists(#reviews, :empty_list), :user_review), #menus = :user_menus,  #images = list_append(if_not_exists(#images, :empty_list), :user_images)",
        ExpressionAttributeNames: {
          "#reviews": "storeReviews",
          "#menus": "storeMenus",
          "#images": "storeImages",
        },
        ExpressionAttributeValues: {
          ":user_review": [
            JSON.stringify({
              reviewID: Math.random().toString(18).slice(2),
              reviewDate,
              clusterName,
              reviewText,
              images: JSON.stringify(images),
            }),
          ],
          ":user_menus": newMenus,
          ":user_images": images,
          ":empty_list": [],
        },
      };
      console.log(updateParams);
      await dynamodb.update(updateParams).promise();
    } else {
      console.log(menus);
      const putParams = {
        TableName: "42chelin-stores",
        Item: {
          storeID: storeID,
          storeAddress: storeAddress,
          storeName: storeName,
          storePhoneNumber: storePhoneNumber,
          storeCategory: storeCategory,
          storeImages: images,
          storeCategoryName: storeCategoryName.split(">")[1].trim(),
          storeLocation: [x, y],
          storeMenus: menus ? [...menus] : undefined,
          storeReviews: [
            JSON.stringify({
              reviewID: Math.random().toString(18).slice(2),
              reviewDate,
              clusterName,
              reviewText,
              images: JSON.stringify(images),
            }),
          ],
          storeLikes: [],
        },
      };

      console.log("2", putParams);
      await dynamodb.put(putParams).promise();
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
