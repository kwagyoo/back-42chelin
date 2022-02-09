/**
 * A Lambda function that returns a string.
 */
const axios = require("axios");
const client = axios.create();

exports.getTokenTest = async ({ code }) => {
    try {
        const res = await client.post(
            "https://api.intra.42.fr/oauth/token",
            {
                grant_type: "authorization_code",
                client_id:
                    "72b0dcddea9c9f7719b20fd9c65f2459f42e30520aace2761b8f24a45ff9a8ac",
                client_secret:
                    "05b4d91fec2780d0141ab6a9939045d363e8e4b5642250162d9a57992984daa1",
                code: code,
                redirect_uri: "http://localhost:3000/login",
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
