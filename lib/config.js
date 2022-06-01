// envs container
const envs = {
  staging: {
    httpPort: 3000,
    httpsPort: 3001,
    envName: "staging",
    hashingSecret: "thisIsASecret",
  },
  production: {
    httpPort: 5000,
    httpsPort: 5001,
    envName: "production",
    hashingSecret: "thisIsAlsoASecret",
  },
};

let currentEnv =
  typeof process.env.NODE_ENV === "string"
    ? process.env.NODE_ENV.toLowerCase()
    : "";

const exportEnv =
  typeof envs[currentEnv] === "object" ? envs[currentEnv] : envs.staging;

module.exports = exportEnv;
