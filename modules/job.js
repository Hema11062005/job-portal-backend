const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  salary: String
});

module.exports = mongoose.model("Job", jobSchema);