const express = require("express");
const http = require("http");
const socket = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

// Setup Express
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Store connected users
let connectedUsers = {};

io.on("connection", (socket) => {
  // Update user count when someone connects
  io.emit("userCountUpdate", Object.keys(connectedUsers).length + 1);

  // Handle location updates
  socket.on("sendLocation", (data) => {
    // Save user location
    connectedUsers[socket.id] = { id: socket.id, ...data };

    // Send location to all users
    io.emit("receiveLocation", { id: socket.id, ...data });

    // Send existing users to new user
    for (const user of Object.values(connectedUsers)) {
      if (user.id !== socket.id) {
        socket.emit("receiveLocation", user);
      }
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    delete connectedUsers[socket.id];
    io.emit("userCountUpdate", Object.keys(connectedUsers).length);
    io.emit("user-disconnected", socket.id);
  });
});

app.get("/", (req, res) => res.render("landing"));
app.get("/app", (req, res) => res.render("index"));

server.listen(process.env.PORT || 3000);
