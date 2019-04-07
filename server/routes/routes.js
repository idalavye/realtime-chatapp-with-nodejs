const express = require("express");
const router = express.Router();
const path = require("path");

const io = require("../socket");

const User = require("../models/user");
const Room = require("../models/room");
const Message = require("../models/message");

router.post("/createUser", (req, res, next) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  user.save().then(() => {
    return res.sendFile(
      path.join(process.mainModule.filename, "..", "..", "public", "index.html")
    );
  });
});

router.post("/login", (req, res, next) => {
  User.find({
    username: req.body.username,
    password: req.body.password
  }).then(user => {
    if (!user[0]) {
      return res.sendFile(
        path.join(
          process.mainModule.filename,
          "..",
          "..",
          "public",
          "error.html"
        )
      );
    }

    req.session.user = user[0];

    return res.sendFile(
      path.join(process.mainModule.filename, "..", "..", "public", "room.html")
    );
  });
});

router.post("/createRoom", async (req, res, next) => {
  let roomNameTmp;
  if (!req.body.roomName) {
    roomNameTmp = "allchat";
  } else {
    roomNameTmp = req.body.roomName;
  }

  await Room.find({ roomName: roomNameTmp }).then(rooms => {
    return User.findById(req.session.user._id)
      .then(user => {
        const room = new Room({ roomName: roomNameTmp, users: [user] });

        if (!rooms[0]) {
          return room.save();
        } else {
          return Room.findById(rooms[0]._id)
            .populate("users")
            .then(room => {
              const users = rooms.users;
              console.log(users);
              if (users) {
                const newUserList = users.filter(
                  user =>
                    user._id.toString() === req.session.user._id.toString()
                );
                if (newUserList.length === 0) {
                  room.users.push(user);
                }
              } else {
                room.users.push(user);
              }

              io.getIO()
                .to(room._id)
                .emit("updateUser", room.users);
              return room.save();
            });
        }
      })
      .then(room => {
        req.session.room = room;
        return res.sendFile(
          path.join(
            process.mainModule.filename,
            "..",
            "..",
            "public",
            "chat.html"
          )
        );
      });
  });
});

router.post("/createmessage", (req, res, next) => {
  if (!req.session.user) {
    return res.sendFile(
      path.join(process.mainModule.filename, "..", "..", "public", "index.html")
    );
  }
  const message = new Message({
    message: req.body.message,
    roomId: req.session.room._id,
    userId: req.session.user._id
  });
  return message.save().then(messageResult => {
    User.findById(messageResult.userId).then(user => {
      const messageTmp = { message: messageResult, username: user.username };
      io.getIO()
        .to(req.session.room._id)
        .emit("newMessage", messageTmp);
    });
  });
});

router.get("/messages", (req, res, next) => {
  Message.find({ roomId: req.session.room._id })
    .populate("userId")
    .then(messages => {
      if (messages.length === 0) {
        messages = [
          {
            message: "This room crated by you",
            roomId: req.session.room._id,
            userId: { username: "Admin", _id: req.session.user._id }
          }
        ];
      }
      res.send(messages);
    });
});

router.get("/activeusers", (req, res, next) => {
  Room.findById(req.session.room._id)
    .populate("users")
    .then(room => {
      res.send(room.users);
    });
});

router.use("/", (req, res, next) => {
  io.getIO().on("disconnected", () => {
    console.log("Client Disconnected");
  });
});

router.post("/disconnecthandler", (req, res, next) => {
  console.log("Client Disconnect");
});

module.exports = router;
