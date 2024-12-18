const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
      console.log("Connected to MongoDB");
      mongoose.connection.close();
  })
  .catch((err) => {
      console.error("MongoDB connection error:", err);
  });
