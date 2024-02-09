require('dotenv').config();

const mongoose = require('mongoose');
const dbUri = process.env.DB_URI;

mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Database connection successful");
  })
  .catch(err => {
    console.error("Database connection error", err);
    process.exit(1);
  });

module.exports = mongoose;
