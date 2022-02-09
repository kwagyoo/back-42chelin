/**
 * A Lambda function that returns a string.
 */
const AWS = require("aws-sdk");
let s3 = new AWS.S3({ region: "ap-northeast-2" });
const dynamodb = new AWS.DynamoDB.DocumentClient();

//등록된 리뷰를 제거하고 리뷰에 연결되어있던 이미지 목록을 지우고, S3 버킷에서의 삭제를 위해 지운 이미지 리스트를 반환한다.

exports.updateReviewData = async (event) => {
  try {
    const { storeID, reviewID } = event.pathParameters;
    const { storeAddress, clusterName, reviewDate, reviewText, reviewImages } = JSON.parse(event.body);

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

      console.log(reviews);

      let selectedReview = reviews
        .map((review) => {
          const parseReview = JSON.parse(review);
          if (parseReview.clusterName === clusterName && parseReview.reviewID === reviewID) {
            console.log({
              ...parseReview,
              images: parseReview.images ? JSON.parse(parseReview.images) : [],
            });
            return {
              ...parseReview,
              images: parseReview.images ? JSON.parse(parseReview.images) : [],
            };
          }
        })
        .filter((x) => x !== undefined)[0];

      console.log("selected", selectedReview);

      if (!selectedReview) throw new Error("cannot find suitable review");

      let willDeleteReviewImages = selectedReview.images.filter((image) => !reviewImages.includes(image)); //삭제될 이미지
      let willAddReviewImages = reviewImages.filter((image) => !selectedReview.images.includes(image)); //새로 추가될 이미지

      willDeleteReviewImages = willDeleteReviewImages ?? [];

      console.log("add", willAddReviewImages);
      console.log("delete", willDeleteReviewImages);

      const updateParams = {
        TableName: "42chelin-stores",
        Key: {
          storeID: storeID,
          storeAddress: storeAddress,
        },
        UpdateExpression: "set #reviews = :filtered_reviews, #images = :filtered_images",
        ExpressionAttributeNames: {
          "#reviews": "storeReviews",
          "#images": "storeImages",
        },
        ExpressionAttributeValues: {
          ":filtered_reviews": reviews.map((review) => {
            const parseReview = JSON.parse(review);
            if (parseReview.clusterName === clusterName && parseReview.reviewDate === reviewDate) {
              return JSON.stringify({
                ...parseReview,
                reviewText: reviewText,
                images: JSON.stringify(reviewImages),
              });
            } else {
              return review;
            }
          }),
          ":filtered_images": getResult.Item.storeImages
            ? getResult.Item.storeImages
                .filter((image) => !willDeleteReviewImages.includes(image))
                .concat(willAddReviewImages)
            : reviewImages,
        },
      };
      await dynamodb.update(updateParams).promise();

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

        console.log(response);
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
