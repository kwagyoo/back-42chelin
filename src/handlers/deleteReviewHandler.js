/**
 * A Lambda function that returns a string.
 */
const AWS = require("aws-sdk");
let s3 = new AWS.S3({ region: "ap-northeast-2" });
const dynamodb = new AWS.DynamoDB.DocumentClient();
const jwt = require("jsonwebtoken");

//등록된 리뷰를 제거하고 리뷰에 연결되어있던 이미지 목록을 지우고, S3 버킷에서의 삭제를 위해 지운 이미지 리스트를 반환한다.

exports.deleteReviewData = async (event) => {
  try {
    const { storeID, reviewID } = event.pathParameters;
    const decoded = jwt.verify(event.headers.Authorization.split(" ")[1], process.env.secret_key);
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
    const getResult = await dynamodb.query(getParams).promise();

    if (Object.keys(getResult).length !== 0) {
      const reviews = getResult.Items[0].storeReviews;
      let willDeleteReviewImages = reviews
        .map(
          //리뷰 삭제에 따른 이미지 삭제도 이루어져야하는데 이부분은 filter가 두번 들어가서 Expression으로 표현할 수가 없다.
          (review) => {
            const parseReview = JSON.parse(review);
            if (
              parseReview.images &&
              parseReview.clusterName === decoded.clusterName &&
              parseReview.reviewID === reviewID
            ) {
              return JSON.parse(parseReview.images);
            } else return null;
          }
        )
        .filter((x) => x !== null)[0];

      willDeleteReviewImages = willDeleteReviewImages ? willDeleteReviewImages : [];
      console.log("willDeleteReviewImages", willDeleteReviewImages);

      const updateParams = {
        TableName: "42chelin-stores",
        Key: {
          storeID: getResult.Items[0].storeID,
          storeAddress: getResult.Items[0].storeAddress,
        },
        UpdateExpression: "set #reviews = :filtered_reviews, #images = :filtered_images",
        ExpressionAttributeNames: {
          "#reviews": "storeReviews",
          "#images": "storeImages",
        },
        ExpressionAttributeValues: {
          ":filtered_reviews": reviews.filter((review) => {
            const parseReview = JSON.parse(review);
            if (parseReview.clusterName === decoded.clusterName && parseReview.reviewID === reviewID) {
              return false;
            } else {
              return true;
            }
          }),
          ":filtered_images": getResult.Items[0].storeImages
            ? getResult.Items[0].storeImages.filter((image) => !willDeleteReviewImages.includes(image))
            : [],
        },
      };
      console.log(updateParams);
      const res = await dynamodb.update(updateParams).promise();

      console.log(willDeleteReviewImages);

      if (willDeleteReviewImages.length > 0) {
        const paramsS3 = {
          Bucket: "42chelin-images",
          Delete: {
            "Objects": willDeleteReviewImages.map((image) => {
              return { Key: `original/${image}` };
            }),
          },
        };

        const response = await s3
          .deleteObjects(paramsS3, function (err, data) {
            if (err) throw err;
            // an error occurred
            else console.log("success", data);
          })
          .promise();

        const paramsResizeS3 = {
          Bucket: "42chelin-images",
          Delete: {
            "Objects": willDeleteReviewImages.map((image) => {
              return { Key: `w_500/${image}` };
            }),
          },
        };

        const resizeResponse = await s3
          .deleteObjects(paramsResizeS3, function (err, data) {
            if (err) throw err;
            // an error occurred
            else console.log("success", data);
          })
          .promise();
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          deletedImages: willDeleteReviewImages,
        }),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    } else {
      throw new Error("no reviews for store");
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

// const jwt = require("jsonwebtoken");

// exports.handler = (event, context, callback) => {
//   console.log(event);
//   const token = event.authorizationToken;
//   console.log(process.env.secret_key);
//   jwt.verify(token, process.env.secret_key, function (err, decoded) {
//       if (err) {
//         console.error("verify failed", err);
//         callback(null,createDenyPolicy('user','*'));
//       } else {
//         callback(null,createAllowPolicy('user','*'));
//       }
//     });
// };

// const createAllowPolicy = (principalId, resource) => {
//   return {
//     principalId: principalId,
//     policyDocument: {
//       Version: "2012-10-17",
//       Statement: [
//         {
//           Action: "execute-api:Invoke",
//           Effect: "Allow",
//           Resource: resource,
//         },
//       ],
//     },
//   };
// };

// const createDenyPolicy = (principal_id, resource) => {
//   return {
//     principalId: principal_id,
//     policyDocument: {
//       Version: "2012-10-17",
//       Statement: [
//         {
//           Action: "execute-api:Invoke",
//           Effect: "Deny",
//           Resource: resource,
//         },
//       ],
//     },
//   };
// };
