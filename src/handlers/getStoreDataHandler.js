/**
 * A Lambda function that returns a string.
 */
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.getStoreData = async () => {
    try {
        const params = {
            TableName: "42chelin_Save_Store",
        };
        const getResult = await dynamodb.scan(params).promise();
        if (getResult.Items.length === 0) return { body: [] };
        const resultFilterThumb = getResult.Items.map(
            ({
                storeName,
                storeAddress,
                storeImages,
                storeReviews,
                storeLocation,
                storeLikes,
            }) => {
                return {
                    storeName,
                    storeAddress,
                    storeImage: storeImages
                        ? storeImages[
                              Math.floor(Math.random() * storeImages.length)
                          ]
                        : [],
                    storeReviews: storeReviews.length,
                    storeLocation,
                    storeLikes: storeLikes.length,
                };
            }
        );
        return { body: resultFilterThumb };
    } catch (error) {
        console.log(error);
        if (error.statusCode)
            throw new Error("status code " + error.statusCode);
        else throw new Error("status code 500. " + error);
    }
};
