const crypto = require("crypto");
const config = require("./config");
// Hash with SHA256
const hash = (str) => {
  if (typeof str === "string" && str.length > 0) {
    return crypto
      .createHmac("sha256", config.hashingSecret)
      .update(str)
      .digest("hex");
  } else return false;
};
// parse json to obj in all cases without err thwow
const parseJsonToObj = (str) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return {};
  }
};

const createRandomString = (num) => {
  num = typeof num === "number" && num > 0 ? num : false;
  if (num) {
    const possibleChar = "abcdefghijklmnopqrstuvwxyz0123456789";
    let res = "";
    for (let i = 0; i <= num; i++) {
      let randomChar =
        possibleChar[Math.floor(Math.random() * possibleChar.length)];
      res += randomChar;
    }
    return res;
  } else return false;
};

module.exports = { hash, parseJsonToObj, createRandomString };
