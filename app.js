const express = require("express");
const http = require("http");
const socket = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Setup Express
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Add basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Store connected users with additional metadata
let connectedUsers = {};
let userCount = 0;

// Helper function to sanitize user input
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>]/g, '').substring(0, 50);
}

io.on("connection", (socket) => {
  userCount++;
  console.log(`User connected: ${socket.id} (Total users: ${userCount})`);
  
  // Update user count when someone connects
  io.emit("userCountUpdate", userCount);

  // Handle location updates with validation
  socket.on("sendLocation", (data) => {
    try {
      const { latitude, longitude, accuracy = 100, myname } = data;
      
      // Validate location data
      if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
          latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        socket.emit("error", "Invalid location data");
        return;
      }

      // Sanitize and validate user name
      const sanitizedName = sanitizeInput(myname) || "Anonymous User";
      
      // Save user location with timestamp
      connectedUsers[socket.id] = { 
        id: socket.id, 
        latitude, 
        longitude, 
        accuracy: Math.min(accuracy, 10000), // Cap accuracy at 10km
        name: sanitizedName,
        lastUpdate: Date.now()
      };

      // Send location to all users
      io.emit("receiveLocation", connectedUsers[socket.id]);

      // Send existing users to new user
      Object.values(connectedUsers).forEach(user => {
        if (user.id !== socket.id) {
          socket.emit("receiveLocation", user);
        }
      });
    } catch (error) {
      console.error("Error processing location data:", error);
      socket.emit("error", "Failed to process location data");
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    userCount--;
    console.log(`User disconnected: ${socket.id} (Total users: ${userCount})`);
    
    delete connectedUsers[socket.id];
    io.emit("userCountUpdate", userCount);
    io.emit("user-disconnected", socket.id);
  });

  // Handle connection errors
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// Routes
app.get("/", (req, res) => res.render("landing"));
app.get("/app", (req, res) => res.render("index"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    users: userCount
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render("landing");
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`TrackSnap server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
