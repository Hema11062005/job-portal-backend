const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const Job = require("./modules/job");
const Application = require("./modules/Application");
const Notification = require("./modules/Notification");

require("dotenv").config();

const app = express();
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://job-portal-mm98-git-main-hemalathar11062005-6247s-projects.vercel.app"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const server = http.createServer(app);

// Socket setup
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://job-portal-mm98-git-main-hemalathar11062005-6247s-projects.vercel.app"
    ],
    methods: ["GET", "POST"]
  }
});

let users = {};

// Socket Connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("registerUser", (phone) => {
    users[phone] = socket.id;
    console.log("Registered user:", phone);
    console.log("Current users:", users);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (let phone in users) {
      if (users[phone] === socket.id) {
        delete users[phone];
      }
    }

    console.log("Users after disconnect:", users);
  });
});

// Test route
app.get("/", (req, res) => {
  res.send("Backend running");
});

// Apply Job
app.post("/apply", async (req, res) => {
  try {
    const { jobTitle, applicantPhone } = req.body;

    const existingApplication = await Application.findOne({
      jobTitle,
      applicantPhone
    });

    if (existingApplication) {
      return res.json({
        message: "You already applied for this job"
      });
    }

    const application = new Application({
      jobTitle,
      applicantPhone,
      status: "Applied"
    });

    await application.save();

    res.json({
      message: "Application submitted successfully"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send Notification
app.post("/notify", async (req, res) => {
  try {
    const { phone, message } = req.body;

    // Save notification in DB
    await Notification.create({
      phone,
      message
    });

    const socketId = users[phone];

    if (socketId) {
      console.log("Sending realtime notification");
      io.to(socketId).emit("notification", message);
    } else {
      console.log("User offline, notification saved in DB");
    }

    res.json({ message: "Notification sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Notifications
app.get("/notifications/:phone", async (req, res) => {
  try {
    const notifications = await Notification.find({
      phone: req.params.phone
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add Job
app.post("/jobs", async (req, res) => {
  try {
    const job = new Job(req.body);
    await job.save();
    res.json({ message: "Job added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Jobs
app.get("/jobs", async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Candidate Applications
app.get("/applications/:phone", async (req, res) => {
  try {
    const applications = await Application.find({
      applicantPhone: req.params.phone
    });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/all-applications", async (req, res) => {
  try {
    const applications = await Application.find();
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Recruiter Updates Application Status
app.post("/update-status", async (req, res) => {
  try {
    const { phone, jobTitle, status } = req.body;

    await Application.findOneAndUpdate(
      {
        applicantPhone: phone,
        jobTitle: jobTitle
      },
      {
        status: status
      }
    );

    res.json({ message: "Status updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});