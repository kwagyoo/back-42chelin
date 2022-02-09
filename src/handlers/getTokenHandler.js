/**
 * A Lambda function that returns a string.
 */
const axios = require("axios");
const client = axios.create();

exports.getToken = async ({ code }) => {
    try {
        const res = await client.post(
            "https://api.intra.42.fr/oauth/token",
            {
                grant_type: "authorization_code",
                client_id:
                    "c99cdf4885e7223c1e66e3060d56b9aac2dd5927b765593c669c78613a5b679d",
                client_secret:
                    "d49df9404304e2bff0365eaec854556af2ce711706f7498caed2d1d5cdd882b3",
                code: code,
                redirect_uri: "https://42chelin.shop/login",
            }
        );
        
        console.log(res.data);

        return {
            body: { access_token: res.data.access_token },
        };
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
