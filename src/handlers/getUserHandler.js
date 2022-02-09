/**
 * A Lambda function that returns a string.
 */
const axios = require("axios");
const client = axios.create();

exports.getUser = async (param) => {
    try {
        const { token } = param;
        const result = await client.get("https://api.intra.42.fr/v2/me", {
            headers: {
                "Authorization": "Bearer " + token,
            },
        });

        return {
            body: JSON.stringify({ nickname: result.data.login }),
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
