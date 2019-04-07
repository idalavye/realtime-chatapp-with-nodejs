var socket = io();

let roomId;

window.onload = function() {
  fetchMessages();
  fetchUsers();
};

socket.on("connect", function() {
  console.log("Server connect");
});

function fetchUsers() {
  $.ajax({
    url: "activeusers",
    method: "GET",
    success: function(data, textStatus, jQxhr) {
      console.log(users);
      var ol = jQuery("<ol></ol>");

      data.forEach(function(user) {
        ol.append(jQuery("<li></li>").text(user.username));
      });

      jQuery("#users").html(ol);
    }
  });
}

function fetchMessages() {
  $.ajax({
    url: "messages",
    method: "GET",
    success: function(data, textStatus, jQxhr) {
      console.log(data);
      roomId = data[0].roomId;
      console.log(roomId);
      for (const item in data) {
        var formattedTime = moment(new Date()).format("h:mm a");
        var template = jQuery("#message-template").html();
        var html = Mustache.render(template, {
          text: data[item].message,
          from: data[item].userId.username,
          createdAt: formattedTime
        });

        jQuery("#messages").append(html);
        scrollToBottom();
      }
      socket.emit("join", { room: roomId }, function(err) {});

      socket.on("newMessage", function(message) {
        console.log(message);
        var formattedTime = moment(new Date()).format("h:mm a");
        var template = jQuery("#message-template").html();
        var html = Mustache.render(template, {
          text: message.message.message,
          from: message.username,
          createdAt: formattedTime
        });

        jQuery("#messages").append(html);
        scrollToBottom();
      });
    }
  });
}

function scrollToBottom() {
  // Selectors
  var messages = jQuery("#messages");
  var newMessage = messages.children("li:last-child");
  // Heights
  var clientHeight = messages.prop("clientHeight");
  var scrollTop = messages.prop("scrollTop");
  var scrollHeight = messages.prop("scrollHeight");
  var newMessageHeight = newMessage.innerHeight();
  var lastMessageHeight = newMessage.prev().innerHeight();

  if (
    clientHeight + scrollTop + newMessageHeight + lastMessageHeight >=
    scrollHeight
  ) {
    messages.scrollTop(scrollHeight);
  }
}

// socket.on("connect", function() {
//   var params = jQuery.deparam(window.location.search);

//   socket.emit("join", params, function(err) {
//     if (err) {
//       alert(err);
//       window.location.href = "/";
//     } else {
//       console.log("No error");
//     }
//   });
// });

socket.on("disconnect", function() {
  console.log("Disconnected from server");
});

socket.on("updateUserList", function(users) {
  var ol = jQuery("<ol></ol>");

  users.forEach(function(user) {
    ol.append(jQuery("<li></li>").text(user));
  });

  jQuery("#users").html(ol);
});

socket.on("newLocationMessage", function(message) {
  var formattedTime = moment(message.createdAt).format("h:mm a");
  var template = jQuery("#location-message-template").html();
  var html = Mustache.render(template, {
    from: message.from,
    url: message.url,
    createdAt: formattedTime
  });

  jQuery("#messages").append(html);
  scrollToBottom();
});

jQuery("#message-form").on("submit", function(e) {
  e.preventDefault();

  $.ajax({
    url: "createmessage",
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
    data: $(this).serialize()
  });

  var messageTextbox = jQuery("[name=message]");
  messageTextbox.val("");
});

var locationButton = jQuery("#send-location");
locationButton.on("click", function() {
  if (!navigator.geolocation) {
    return alert("Geolocation not supported by your browser.");
  }

  locationButton.attr("disabled", "disabled").text("Sending location...");

  navigator.geolocation.getCurrentPosition(
    function(position) {
      locationButton.removeAttr("disabled").text("Send location");
      socket.emit("createLocationMessage", {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    },
    function() {
      locationButton.removeAttr("disabled").text("Send location");
      alert("Unable to fetch location.");
    }
  );
});
