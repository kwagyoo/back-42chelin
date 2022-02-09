/**
 * A Lambda function that returns a string.
 */
const axios = require("axios");
const client = axios.create();

exports.unregisterUser = async ({ code }) => {
  return {
    statusCode: 200,
  };
};
