const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  jobTitle: {
    type: String,
    required: true
  },
  applicantPhone: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: "Applied"
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Application", applicationSchema);