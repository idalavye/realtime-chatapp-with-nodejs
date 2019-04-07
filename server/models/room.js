const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const roomSchema = new Schema({
  roomName: {
    type: String,
    required: true
  },
  users: [
    {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  messages:[
      
  ]
});

module.exports = mongoose.model("Room", roomSchema);
