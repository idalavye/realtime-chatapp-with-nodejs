let io;
let socketWithRoom;

const mongoose = require("mongoose");

const User = require("./models/user");
const Room = require("./models/room");

module.exports = {
  init: httpServer => {
    io = require("socket.io")(httpServer);
    io.on("connection", socket => {
      console.log("Client Connect");
      let paramsTmp;

      socket.on("join", params => {
        paramsTmp = params;
        socket.join(params.room);
        socketWithRoom = socket;
      });

      socket.on("disconnect", () => {
        console.log("Client Disconnected");
        if (paramsTmp) {
          Room.findById(paramsTmp.room)
            .populate("users")
            .then(room => {
              const users = room.users;
              const newUsersList = users.filter(
                user => user._id.toString() !== paramsTmp.user._id.toString()
              );
              room.users = newUsersList;
              io.to(room._id).emit("updateUser", newUsersList);
              return room.save();
            })
            .then(room => {
              console.log("Kullanıcı odadan çıktı");
            })
            .catch(err => console.log(err));
        }
      });
    });
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized");
    }
    return io;
  },
  getRoom: () => {
    if (!socketWithRoom) {
      throw new Error("Room not avaible");
    }
    return socketWithRoom;
  }
};
