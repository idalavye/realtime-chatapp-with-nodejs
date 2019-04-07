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

router.post("/createRoom", (req, res, next) => {
  const room = new Room({ roomName: req.body.roomName });

  Room.find({ roomName: req.body.roomName }).then(rooms => {
    if (!rooms[0]) {
      room.save().then(room => {
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
    }

    req.session.room = rooms[0];

    return res.sendFile(
      path.join(process.mainModule.filename, "..", "..", "public", "chat.html")
    );
  });
});

router.post("/createmessage", (req, res, next) => {
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
            userId: { username: "Admin" }
          }
        ];
      }
      res.send(messages);
    });
});

module.exports = router;
