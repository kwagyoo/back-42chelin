// /**
//  * A Lambda function that returns a string.
//  */
//  const fetch = require("node-fetch");
//  const AWS = require("aws-sdk");
//  const lambda = new AWS.Lambda({
//      region: "ap-northeast-2", //change to your region
//  });
//  const dynamodb = new AWS.DynamoDB.DocumentClient();

//  exports.saveStoreData = async (request) => {
//      const { token, name, address, date, reviewText, userName } = request;
//      console.log(request);

//      const invokeresult = await lambda
//          .invoke(
//              {
//                  FunctionName: "backend-42chelin-getUserFunction-CuChxSStrBkx",
//                  InvocationType: "RequestResponse",
//                  Payload: JSON.stringify({token:token}), // pass params
//              },
//              function (error, data) {
//                  if (error) {
//                      console.log("error ", error, data);
//                      return { body: JSON.stringify({ statusCode: 404 }) };
//                  } else {
//                      console.log("hello", error, data);
//                      return {body:JSON.stringify({ data:data })}; //이게 잘 안 통함
//                  }
//              }
//          )
//          .promise()
//          .then()
//          .catch((err) => {
//              console.log("error ", err);
//              return JSON.stringify({Error:})
//          });

//      try {
//          const getParams = {
//              TableName: "backend-42chelin-StoreTable-Q3RMMCRFR7AU",
//              Key: {
//                  storeName: name,
//                  storeBranch: JSON.stringify(address),
//              },
//          };
//          const getResult = await dynamodb.get(getParams).promise();
//          if (getResult) {
//              const updateParams = {
//                  TableName: "backend-42chelin-StoreTable-Q3RMMCRFR7AU",
//                  Key: {
//                      storeName: name,
//                      storeBranch: JSON.stringify(address),
//                  },
//                  UpdateExpression:
//                      "set #reviews = list_append(if_not_exists(#reviews, :empty_list), :user_review)",
//                  ExpressionAttributeNames: { "#reviews": "storeReviews" },
//                  ExpressionAttributeValues: {
//                      ":user_review": [
//                          JSON.stringify({ date, userName, reviewText }),
//                      ],
//                      ":empty_list": [],
//                  },
//              };
//              const result = await dynamodb.update(updateParams).promise();
//              console.log(result);
//              return JSON.stringify({ status: true });
//          } else {
//              const putParams = {
//                  TableName: "backend-42chelin-StoreTable-Q3RMMCRFR7AU",
//                  Item: {
//                      storeName: name,
//                      storeBranch: JSON.stringify(address),
//                      storeReviews: [
//                          JSON.stringify({ date, userName, reviewText }),
//                      ],
//                  },
//              };
//              const result = await dynamodb.put(putParams).promise();
//              console.log("put", result);
//              return JSON.stringify({ status: true });
//          }
//      } catch (err) {
//          console.log("error occurs :", err);
//          return JSON.stringify({ status: false, error: err });
//      }
//  };
