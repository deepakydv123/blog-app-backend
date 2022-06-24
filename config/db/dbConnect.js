const mongoose = require("mongoose");

// Returrns the string to connect with the database
const getDBConnectionString = () => {
  const db_connection_url = process.env.MONGODB_URL.replace(
    "<username>:<password>",
    `${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}`
  );

  return db_connection_url;
};

// Function to connect with the database
const dbConnect = async () => {
  try {
    await mongoose.connect(getDBConnectionString(), {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    console.log("Database connected successfully.");
  } catch (err) {
    console.log(
      `There is error while connecting with the database: ${err.message}`
    );
  }
};

module.exports = dbConnect;
