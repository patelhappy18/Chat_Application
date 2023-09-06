//web socket allows us full-duplex communication
//web socket is a seperate protocol then http
//persistent connection between client and server
//in http it sends u data when u request the server to send but in web socket it stays connected and sends data without request
//whenever one user sends message the server will send that message to all the members without any request from the users

//include socket.io here then add default socket.io js file in our custom js and fetch const socket = io();

// you also explicitly create an HTTP server using http.createServer(app).
// This gives you more control over the server configuration and allows you to
// integrate other libraries. Then, you use socketio(server) to create a Socket.io
// instance that works on top of the HTTP server. This approach is slightly more
// flexible and allows you to customize the HTTP server settings if needed.

const express = require("express"); // for running the server of our application
const http = require("http"); //core module no need to install
const path = require("path"); // working with the public directory ( No need to install )
const { generateMessages } = require("./utils/messages");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "/public"); //this set the view path of public folder

const Filter = require("bad-words"); //this is remove bad words from the message

const {
  addUser,
  getUser,
  getUsersInRoom,
  removeUser,
} = require("./utils/users");

app.use(express.static(publicDirectoryPath));
let count = 0;

io.on("connection", (socket) => {
  //this function will run for each number of connections
  //If there are 5 new connection this will run 5 times
  //Whenever a client visits the server this message will be displayed
  console.log("New WebSocket connection");

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room); //this will join a user to the specific room given by the user

    socket.emit("message", generateMessages("Admin", "Welcome!")); //this basically greet only one client at a time
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessages("Admin", `${user.username} has joined!`)
      );

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom({ room: user.room }),
    });

    callback();
    //io.to.emit => send everyone to a specific chat room
    //socket.broadcast.to.emit => send everyone except the person to a specific chat room
  });

  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed"); //this will check the profanity present in the message
    }
    const user = getUser({ id: socket.id });

    io.to(user.room).emit("message", generateMessages(user.username, message)); // this basically greet everyone who joins
    callback();
  });

  //broadcast will send message to everyone except the user which joins the server

  socket.on("location", (coords, callback) => {
    const user = getUser({ id: socket.id });

    io.to(user.room).emit(
      "locationMessage",
      generateMessages(
        user.username,
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
      //url to send the exact google map location
    );
    callback();
  });

  //during disconnect we always use socket.on
  socket.on("disconnect", () => {
    const user = removeUser({ id: socket.id });
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessages(`${user.username} has left`)
      ); // this basically greet everyone who joins

      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom({ room: user.room }),
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server running at ${port}`);
});
