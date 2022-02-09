/**
 * A Lambda function that returns a string.
 */
const fetch = require("node-fetch");
const AWS = require("aws-sdk");
const lambda = new AWS.Lambda({
    region: "ap-northeast-2", //change to your region
});
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.saveStoreData = async (request) => {
    try {
        console.log(request);
        const {
            token,
            storeName,
            storeAddress,
            storeID,
            storeCategory,
            reviewDate,
            reviewText,
            userName,
            images,
            x,
            y,
        } = request;

        const invokeResult = await lambda
            .invoke({
                FunctionName: "backend-42chelin-getUserFunction-s0ohofJ74gVg",
                InvocationType: "RequestResponse",
                Payload: JSON.stringify({ token: token }), // pass params
            })
            .promise();

        const payload = JSON.parse(invokeResult.Payload);
        if(payload.errorType)
        {
            throw new Error("cannot log in");
        }
        
        const getParams = {
            TableName: "42chelin_Save_Store",
            Key: {
                storeName: storeName,
                storeAddress: storeAddress,
            },
        };
        const getResult = await dynamodb.get(getParams).promise();

        if (Object.keys(getResult).length !== 0) {
            const reviews = getResult.Item.storeReviews;

            reviews.forEach((review) => {
                const parsedReview = JSON.parse(review);
                console.log(review);
                if (
                    parsedReview.userName === userName &&
                    parsedReview.reviewDate === reviewDate
                ) {
                    throw new Error("Cannot post two reviews in one day.");
                }
            });

            const updateParams = {
                TableName: "42chelin_Save_Store",
                Key: {
                    storeName: storeName,
                    storeAddress: storeAddress,
                },
                UpdateExpression:
                    "set #reviews = list_append(if_not_exists(#reviews, :empty_list), :user_review), #images = list_append(if_not_exists(#images, :empty_list), :user_images)",
                ExpressionAttributeNames: {
                    "#reviews": "storeReviews",
                    "#images": "storeImages",
                },
                ExpressionAttributeValues: {
                    ":user_review": [
                        JSON.stringify({
                            reviewDate,
                            userName,
                            reviewText,
                            images: JSON.stringify(images),
                        }),
                    ],
                    ":user_images": images,
                    ":empty_list": [],
                },
            };
            const res = await dynamodb.update(updateParams).promise();
        } else {
            const putParams = {
                TableName: "42chelin_Save_Store",
                Item: {
                    storeName: storeName,
                    storeAddress: storeAddress,
                    storeID: storeID,
                    storeCategory: storeCategory,
                    storeImages: images,
                    storeLocation: [x, y],
                    storeReviews: [
                        JSON.stringify({
                            reviewDate,
                            userName,
                            reviewText,
                            images: JSON.stringify(images),
                        }),
                    ],
                    storeLikes: [],
                },
            };
            await dynamodb.put(putParams).promise();
        }
        return { body: { status: true } };
    } catch (error) {
        if (error.response) {
            // 요청이 이루어졌으며 서버가 2xx의 범위를 벗어나는 상태 코드로 응답했습니다.
            throw new Error(
                "status code " +
                    error.response.status +
                    ". " +
                    error.response.data.message
            );
        } else if (error.request) {
            throw new Error("status code 400. " + error.request);
        } else if (error.message) {
            // 오류를 발생시킨 요청을 설정하는 중에 문제가 발생했습니다.
            throw new Error("status code 500. " + error.message);
        } else {
            throw new Error("status code 500. " + error);
        }
    }
};
