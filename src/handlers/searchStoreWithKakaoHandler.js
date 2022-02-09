const axios = require("axios");

exports.searchStoreWithKakao = async (event) => {
  try {
    const { storeName } = event.queryStringParameters;
    const result = await axios.get(`https://dapi.kakao.com/v2/local/search/keyword.json`, {
      headers: {
        Authorization: "KakaoAK 31728df3dfb380d67a2e8af80fb96287",
      },
      params: {
        query: storeName,
      },
    });
    const filteredResult = result.data.documents.filter(
      (store) => ["CE7", "FD6"].includes(store.category_group_code) || store.category_name.includes("음식점")
    );
    return {
      statusCode: 200,
      body: JSON.stringify(filteredResult),
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
