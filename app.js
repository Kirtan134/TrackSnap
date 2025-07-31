const express = require("express");
const http = require("http");
const socket = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

let userCount = 0;
let connectedUsers = {}; // Store user data

io.on("connection", (socket) => {
  userCount++;
  io.emit("userCountUpdate", userCount);

  socket.on("sendLocation", (data) => {
    // Store user data
    connectedUsers[socket.id] = { id: socket.id, ...data };

    // Send to all users
    io.emit("receiveLocation", { id: socket.id, ...data });

    // Send existing users to the new user
    Object.values(connectedUsers).forEach((user) => {
      if (user.id !== socket.id) {
        socket.emit("receiveLocation", user);
      }
    });
  });

  socket.on("disconnect", () => {
    userCount--;
    delete connectedUsers[socket.id];
    io.emit("userCountUpdate", userCount);
    io.emit("user-disconnected", socket.id);
  });
});

app.get("/", (req, res) => res.render("landing"));
app.get("/app", (req, res) => res.render("index"));

server.listen(process.env.PORT || 3000);
