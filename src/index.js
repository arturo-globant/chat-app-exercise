const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const { generateMsgObj } = require("./utils/messages");
const {
  addUser,
  removeUSer,
  getUser,
  getUsersInRom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT;

// Define paths for Express config
const publicPath = path.join(__dirname, "../public");

// Setup static  directory to serve
app.use(express.static(publicPath));

app.get("", (req, res) => {
  res.render("index");
});

io.on("connection", (socket) => {
  console.log("New Websocket connection");

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({
      id: socket.id,
      username,
      room,
    });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    socket.broadcast
      .to(user.room)
      .emit("userStatus", `${user.username} has joined!`);

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRom(user.room),
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter();

    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed");
    }

    const { room, username } = getUser(socket.id);

    if (room) {
      io.to(room).emit("message", generateMsgObj(username, message));
      callback();
    }
  });

  socket.on("sendLocation", (coords, callback) => {
    const { room, username } = getUser(socket.id);
    if (room) {
      io.to(room).emit(
        "locationMessage",
        generateMsgObj(
          username,
          `https://google.com/maps?q=${coords.lat},${coords.long}`
        )
      );
      callback();
    }
  });

  socket.on("disconnect", () => {
    const user = removeUSer(socket.id);

    if (user) {
      io.to(user.room).emit("userStatus", `${user.username} has left`);
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log("Server is on on port " + port);
});
