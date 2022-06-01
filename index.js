// Dependencies
const http = require("http");
const https = require("https");
const url = require("url");
const StringDecored = require("string_decoder").StringDecoder;
const fs = require("fs");
// Other files
const config = require("./lib/config");
const handlers = require("./lib/handlers");
const { parseJsonToObj } = require("./lib/helpers");

// Instantiate the http server
const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});
// Starts the http server
httpServer.listen(config.httpPort, () => {
  console.log(`HTTP server listening on port ${config.httpPort}`);
});
// Instantiate the https server
const httpsServerOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem"),
};
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
});
// Starts the https server
httpsServer.listen(config.httpsPort, () => {
  console.log(`HTTPS server listening on port ${config.httpsPort}`);
});
// server logic (both http and https)
const unifiedServer = (req, res) => {
  // Generate the data taht will be forming the obj
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const trimedPath = path.replace(/^\/+|\/+$/g, "");
  const queryStrObj = JSON.parse(JSON.stringify(parsedUrl.query));
  const method = req.method.toLowerCase();
  const headers = req.headers;
  // Get payload if any
  const decoder = new StringDecored("utf-8");
  let buffer = "";
  req.on("data", (data) => {
    buffer += decoder.write(data);
  });
  req.on("end", () => {
    buffer += decoder.end();
    // Choose the handler req should go. if not found, go to notFound()
    let chosenHandler =
      typeof router[trimedPath] !== "undefined"
        ? router[trimedPath]
        : handlers.notfound;
    const data = {
      trimedPath,
      queryStrObj,
      method,
      headers,
      payload: parseJsonToObj(buffer),
    };
    // Route the req to the handler specified in the router
    chosenHandler(data, (statusCode, payload) => {
      // Use statusCode called back by the handler or def 200
      statusCode = typeof statusCode === "number" ? statusCode : 200;
      // Use payload called back by the handler or def {}
      payload = typeof payload === "object" ? payload : {};
      //   conver payload to str
      let payloadStr = JSON.stringify(payload);
      //  return response
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadStr);
      // Log the req
      console.log("Returning Response: ", statusCode, payloadStr);
    });
  });
};

// Define a req router
const router = {
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
};
