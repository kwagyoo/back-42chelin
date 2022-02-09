/**
 * A Lambda function that returns a string.
 */
const axios = require("axios");
const client = axios.create();

exports.getStoreInfoWithKakao = async (event) => {
  try {
    const { storeID } = event.pathParameters;
    const { storeName } = event.queryStringParameters;
    const result = await client.get(`https://dapi.kakao.com/v2/local/search/keyword.json`, {
      headers: {
        Authorization: "KakaoAK 31728df3dfb380d67a2e8af80fb96287",
      },
      params: {
        query: storeName,
        sort: "accuracy",
        size: 15,
        page: 1,
      },
    });

    console.log(storeID, storeName);
    const filteredResult = result.data.documents
      .filter(
        (store) =>
          store.id === storeID &&
          (["FD6", "CE7"].includes(store.category_group_code) || store.category_name.includes("음식점"))
      )
      .map((filtered) => {
        if (filtered.category_group_code) return filtered;
        else
          return {
            ...filtered,
            category_group_code: filtered.category_name.includes("음식점") ? "FD6" : "CE7",
          };
      });
    console.log(filteredResult);
    return {
      statusCode: 200,
      body: JSON.stringify(filteredResult[0]),
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
