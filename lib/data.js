const fs = require("fs");
const path = require("path");
// libs
const { parseJsonToObj } = require("./helpers");

// TODO convertir a promesas

const lib = {
  baseDir: path.join(__dirname, "/../.data/"),
  create: function (dir, fileName, data, cb) {
    fs.open(
      this.baseDir + dir + "/" + fileName + ".json",
      "wx",
      (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
          fs.writeFile(fileDescriptor, JSON.stringify(data), (err) => {
            if (!err) {
              fs.close(fileDescriptor, (err) => {
                if (!err) {
                  cb(false);
                } else {
                  cb("Error closing new file");
                }
              });
            } else {
              cb("Error writing the file");
            }
          });
        } else {
          cb("Could not create a new file, it may already exist");
        }
      }
    );
  },
  // Read data from a file
  read: function (dir, fileName, cb) {
    fs.readFile(
      this.baseDir + dir + "/" + fileName + ".json",
      "utf-8",
      (err, data) => {
        if (!err && data) {
          let parsedData = parseJsonToObj(data);
          cb(false, parsedData);
        } else {
          cb(err, data);
        }
      }
    );
  },
  update: function (dir, fileName, data, cb) {
    fs.open(
      this.baseDir + dir + "/" + fileName + ".json",
      "r+",
      (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
          fs.ftruncate(fileDescriptor, (err) => {
            if (!err) {
              fs.writeFile(fileDescriptor, JSON.stringify(data), (err) => {
                if (!err) {
                  fs.close(fileDescriptor, (err) => {
                    if (!err) {
                      cb(false);
                    } else {
                      cb("Error closing the file");
                    }
                  });
                } else {
                  cb("Error writing to existing file");
                }
              });
            } else {
              console.log("Error truncating file");
            }
          });
        } else {
          cb("Could not open the file, it may not exist yet/anymore");
        }
      }
    );
  },
  delete: function (dir, fileName, cb) {
    fs.unlink(this.baseDir + dir + "/" + fileName + ".json", (err) => {
      if (!err) {
        cb(false);
      } else {
        cb("Error deleting the file");
      }
    });
  },
};

module.exports = lib;
