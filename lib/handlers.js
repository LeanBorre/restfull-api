// Dependencies
const _data = require("./data");
const { hash, createRandomString } = require("./helpers");
// Define handlers
let handlers = {
  notfound: function (data, cb) {
    cb(404);
  },
  ping: function (data, cb) {
    cb(200);
  },
  users: function (data, cb) {
    const methsAv = ["post", "get", "put", "delete"];
    if (methsAv.indexOf(data.method) > -1) {
      handlers._users[data.method](data, cb);
    } else {
      cb(405);
    }
  },
  _users: {
    //   req data: first name, last name, id, pass, tass
    post: function (data, cb) {
      let firstName =
        typeof data.payload.firstName === "string" &&
        data.payload.firstName.trim().length > 0
          ? data.payload.firstName.trim()
          : false;
      let lastName =
        typeof data.payload.lastName === "string" &&
        data.payload.lastName.trim().length > 0
          ? data.payload.lastName.trim()
          : false;
      let phone =
        typeof data.payload.phone === "string" &&
        data.payload.phone.trim().length === 10
          ? data.payload.phone.trim()
          : false;
      let password =
        typeof data.payload.password === "string" &&
        data.payload.password.trim().length > 0
          ? data.payload.password.trim()
          : false;
      let toss =
        typeof data.payload.toss === "boolean" && data.payload.toss === true
          ? true
          : false;
      // console.table([{ firstName, lastName, phone, password, toss }]);
      if (firstName && lastName && phone && password && toss) {
        //   Make sure user does not exist
        _data.read("users", phone, (err, data) => {
          if (err) {
            // hash the password
            const hashedPass = hash(password);
            if (hashedPass) {
              // create user obj
              const userObj = {
                firstName,
                lastName,
                phone,
                password: hashedPass,
                toss,
              };
              // store the user
              _data.create("users", phone, userObj, (err) => {
                if (!err) {
                  cb(201, { User: "User created succesfully" });
                } else {
                  console.log(err);
                  cb(500, { Error: "Could not create the new user" });
                }
              });
            } else {
              cb(500, { Error: "Coluld not hash the user's password" });
            }
          } else {
            // user already exist
            cb(400, { Error: "A user with that phone number already exist" });
          }
        });
      } else {
        cb(400, { Error: "Missing required fields" });
      }
    },
    get: function (data, cb) {
      // check number is valid
      const phone =
        typeof data.queryStrObj.phone === "string" &&
        data.queryStrObj.phone.trim().length === 10
          ? data.queryStrObj.phone.trim()
          : false;
      if (phone) {
        // get token from headers
        let token =
          typeof data.headers.token === "string" ? data.headers.token : false;
        handlers._tokens.verify(token, phone, (isValid) => {
          if (isValid) {
            _data.read("users", phone, (err, data) => {
              if (!err && data) {
                // remove the hashed pass from the obj before returning
                delete data.password;
                cb(200, data);
              } else {
                cb(404);
              }
            });
          } else {
            cb(403, {
              Error: "Missing required token in header, or token is invalid",
            });
          }
        });
      } else {
        cb(400, { Error: "Missing required field" });
      }
    },
    put: function (data, cb) {
      // check required fields
      let phone =
        typeof data.payload.phone === "string" &&
        data.payload.phone.trim().length === 10
          ? data.payload.phone.trim()
          : false;
      // check optional fields (3, at least one must be determined)
      let firstName =
        typeof data.payload.firstName === "string" &&
        data.payload.firstName.trim().length > 0
          ? data.payload.firstName.trim()
          : false;
      let lastName =
        typeof data.payload.lastName === "string" &&
        data.payload.lastName.trim().length > 0
          ? data.payload.lastName.trim()
          : false;
      let password =
        typeof data.payload.password === "string" &&
        data.payload.password.trim().length > 0
          ? data.payload.password.trim()
          : false;
      // err if phone is invalid
      if (phone) {
        // err if nothing sent to update
        if (firstName || lastName || password) {
          // get token from headers
          let token =
            typeof data.headers.token === "string" ? data.headers.token : false;
          handlers._tokens.verify(token, phone, (isValid) => {
            if (isValid) {
              // lookup to user
              _data.read("users", phone, (err, userData) => {
                if (!err && userData) {
                  // update fields
                  if (firstName) {
                    userData.firstName = firstName;
                  }
                  if (lastName) {
                    userData.lastName = lastName;
                  }
                  if (password) {
                    userData.password = hash(password);
                  }
                  // store the updates
                  _data.update("users", phone, userData, (err) => {
                    if (!err) {
                      cb(200);
                    } else {
                      console.log(err);
                      cb(500, { Error: "Could not update the user" });
                    }
                  });
                } else {
                  cb(404, { Error: "The specified user does not exist" });
                }
              });
            } else {
              cb(403, {
                Error: "Missing required token in header, or token is invalid",
              });
            }
          });
        } else {
          cb(400, { Error: "Missing fields to update" });
        }
      } else {
        cb(400, { Error: "Missing required field" });
      }
    },
    // TODO borrar todo lo relacionado al mismo usuario (checks, u otros archivos)
    delete: function (data, cb) {
      // Check phone is valid
      let phone =
        typeof data.queryStrObj.phone === "string" &&
        data.queryStrObj.phone.trim().length === 10
          ? data.queryStrObj.phone.trim()
          : false;
      if (phone) {
        // get token from headers
        let token =
          typeof data.headers.token === "string" ? data.headers.token : false;
        handlers._tokens.verify(token, phone, (isValid) => {
          if (isValid) {
            _data.read("users", phone, (err, data) => {
              if (!err && data) {
                // remove the hashed pass from the obj before returning
                _data.delete("users", phone, (err) => {
                  if (!err) {
                    cb(200);
                  } else {
                    cb(500, { Error: "Could not delete the specified user" });
                  }
                });
              } else {
                cb(400, { Error: "Could not found the specified user" });
              }
            });
          } else {
            cb(403, {
              Error: "Missing required token in header, or token is invalid",
            });
          }
        });
      } else {
        cb(400, { Error: "Missing required field" });
      }
    },
  },
  tokens(data, cb) {
    const methsAv = ["post", "get", "put", "delete"];
    if (methsAv.indexOf(data.method) > -1) {
      handlers._tokens[data.method](data, cb);
    } else {
      cb(405);
    }
  },
  _tokens: {
    post(data, cb) {
      let phone =
        typeof data.payload.phone === "string" &&
        data.payload.phone.trim().length === 10
          ? data.payload.phone.trim()
          : false;
      let password =
        typeof data.payload.password === "string" &&
        data.payload.password.trim().length > 0
          ? data.payload.password.trim()
          : false;
      if (phone && password) {
        _data.read("users", phone, (err, userData) => {
          if (!err && userData) {
            const hashedPass = hash(password);
            if (hashedPass === userData.password) {
              // if valid create a new token w/ random name. set expiration 1h future
              const tokenId = createRandomString(20);
              const expires = Date.now() + 1000 * 60 * 60;
              const token = {
                phone,
                id: tokenId,
                expires,
              };
              // store the token
              _data.create("tokens", tokenId, token, (err) => {
                if (!err) {
                  cb(200, token);
                } else {
                  cb(500, { Error: "Could not create the new token" });
                }
              });
            } else {
              cb(400, {
                Error:
                  "Password did not match the specified user(s) stored password",
              });
            }
          } else {
            cb(400, { Error: "Could not found the specified user" });
          }
        });
      } else {
        cb(400, { Error: "Missing required field(s)" });
      }
    },
    get(data, cb) {
      let id =
        typeof data.queryStrObj.id.trim() === "string" &&
        data.queryStrObj.id.trim().length === 21
          ? data.queryStrObj.id.trim()
          : false;
      if (id) {
        _data.read("tokens", id, (err, tokenData) => {
          if (!err && tokenData) {
            cb(200, tokenData);
          } else {
            cb(404);
          }
        });
      } else {
        cb(400, { Error: "Missing required field" });
      }
    },
    put(data, cb) {
      // console.log(data.queryStrObj);
      let id =
        typeof data.payload.id.trim() === "string" &&
        data.payload.id.trim().length === 21
          ? data.payload.id.trim()
          : false;
      let extend =
        typeof data.payload.extend === "boolean" && data.payload.extend === true
          ? data.payload.extend
          : false;
      if (id && extend) {
        _data.read("tokens", id, (err, tokenData) => {
          if (!err && tokenData) {
            if (tokenData.expires > Date.now()) {
              tokenData.expires = Date.now() + 1000 * 60 * 60;
              _data.update("tokens", id, tokenData, (err) => {
                if (!err) {
                  cb(200);
                } else {
                  cb(500, { Error: "Could not extend token's expiration" });
                }
              });
            } else {
              cb(400, { Error: "Token already expired, cannot be extended" });
            }
          } else {
            cb(400, { Error: "Specified token does not exist" });
          }
        });
      } else {
        cb(400, { Error: "Missing required field(s) / Field(s) invalid" });
      }
    },
    delete(data, cb) {
      let id =
        typeof data.queryStrObj.id === "string" &&
        data.queryStrObj.id.trim().length === 21
          ? data.queryStrObj.id.trim()
          : false;
      if (id) {
        _data.read("tokens", id, (err, tokenData) => {
          if (!err && tokenData) {
            _data.delete("tokens", id, (err) => {
              if (!err) {
                cb(200);
              } else {
                cb(500, { Error: "Could not delete the specified token" });
              }
            });
          } else {
            cb(400, { Error: "Could not found the specified token" });
          }
        });
      } else {
        cb(400, { Error: "Missing required field" });
      }
    },
    verify(id, phone, cb) {
      _data.read("tokens", id, (err, tokenData) => {
        if (!err && tokenData) {
          if (tokenData.phone === phone && tokenData.expires > Date.now()) {
            cb(true);
          } else {
            cb(false);
          }
        } else {
          cb(false);
        }
      });
    },
  },
};

module.exports = handlers;
