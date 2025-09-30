// const mongoose = require("mongoose");
// mongoose.connect(process.env.MONGODB_URL);
// const connectionResult = mongoose.connection;

// connectionResult.on("error", () => {
//   console.log("connection error");
// });
// connectionResult.on("connected", () => {
//   console.log("connection successful");
// });

// module.exports = connectionResult;

// server/config/dbconfig.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    mongoose.connect(process.env.MONGODB_URL);
    const connectionResult = mongoose.connection;

    connectionResult.on("error", () => {
      console.log("connection error");
    });
    connectionResult.on("connected", () => {
      console.log("connection successful");
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
