const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");

const { generateMessage, generateLocationMessage } = require("./utils/message");
const { isRealString } = require("./utils/validation");
const { Users } = require("./utils/users");

const routes = require("./routes/routes");

const publicPath = path.join(__dirname, "../public");
const port = process.env.PORT || 3001;
var app = express();

app.use(express.static(publicPath));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false
  })
);

app.use(routes);

mongoose
  .connect("mongodb://localhost:27017/chatapp")
  .then(result => {
    var server = app.listen(port);

    require("./socket").init(server);
  })
  .catch(err => {
    console.log(err);
  });

//   io.on("connection", socket => {
//     console.log("New user connected");

//     socket.on("join", (params, callback) => {
//       if (!isRealString(params.name) || !isRealString(params.room)) {
//         return callback("Name and room name are required.");
//       }

//       socket.join(params.room);
//       users.removeUser(socket.id);
//       users.addUser(socket.id, params.name, params.room);

//       io.to(params.room).emit("updateUserList", users.getUserList(params.room));
//       socket.emit(
//         "newMessage",
//         generateMessage("Admin", "Welcome to the chat app")
//       );
//       socket.broadcast
//         .to(params.room)
//         .emit(
//           "newMessage",
//           generateMessage("Admin", `${params.name} has joined.`)
//         );
//       callback();
//     });

//     socket.on("createMessage", (message, callback) => {
//       var user = users.getUser(socket.id);

//       if (user && isRealString(message.text)) {
//         io.to(user.room).emit(
//           "newMessage",
//           generateMessage(user.name, message.text)
//         );
//       }

//       callback();
//     });

//     socket.on("createLocationMessage", coords => {
//       var user = users.getUser(socket.id);

//       if (user) {
//         io.to(user.room).emit(
//           "newLocationMessage",
//           generateLocationMessage(user.name, coords.latitude, coords.longitude)
//         );
//       }
//     });

//     socket.on("disconnect", () => {
//       var user = users.removeUser(socket.id);

//       if (user) {
//         io.to(user.room).emit("updateUserList", users.getUserList(user.room));
//         io.to(user.room).emit(
//           "newMessage",
//           generateMessage("Admin", `${user.name} has left.`)
//         );
//       }
//     });
//   });

//   server.listen(port, () => {
//     console.log(`Server is up on ${port}`);
//   });
// });
