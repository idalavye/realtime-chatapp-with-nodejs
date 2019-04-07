let io;
let socketWithRoom;

const Message 

module.exports = {
  init: httpServer => {
    io = require("socket.io")(httpServer);
    io.on("connection", socket => {
      console.log("Client Connect");

      socket.on("join", params => {
        console.log(params);
        socket.join(params.room);
        socketWithRoom = socket;


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
