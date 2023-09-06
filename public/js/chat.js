const socket = io();

const $messageForm = document.querySelector("#message_form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#sendlocation");
const $messages = document.querySelector("#messages");

const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  // When you call event.preventDefault() within an event listener,
  // it instructs the browser not to execute the default action associated
  // with that event. Instead, you can use JavaScript to perform your own
  // custom actions or implement alternative behavior.

  // e.target.elements.message.value
  //the above code will print the message with name="message"
  $messageFormButton.setAttribute("disabled", "disabled"); //enabling and disabling a button makes it blink
  const message = document.getElementById("message").value;
  socket.emit("sendMessage", message, (error) => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus(); //this will move focus to the input field

    if (error) {
      return console.log(error);
    }
    console.log("message delivered!");
    //this is the call back function which will be called from the server side
  });
});

//URL for send google location link https://google.com/maps?q=lat,lon

$sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported in your browser");
  }
  $sendLocationButton.setAttribute("disabled", "disabled"); //enabling and disabling a button makes it blink

  navigator.geolocation.getCurrentPosition((pos) => {
    socket.emit(
      "location",
      {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      },
      (error) => {
        $sendLocationButton.removeAttribute("disabled");

        // $messageFormInput.value = "";
        //  $messageFormInput.focus();
        if (error) {
          return console.log(error);
        }
        console.log("location delivered!");
      }
    );
  });
});

const autoScroll = () => {
  //new message element
  const $newMessage = $messages.lastElementChild;

  //Height of new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  //visible height
  const visibleHeight = $messages.offsetHeight;

  //Heigh of message container
  const containerHeight = $messages.scrollHeight;

  //how far have i scrolled?
  const scrollOfSet = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOfSet) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("message", (msg) => {
  console.log(msg);
  const html = Mustache.render(messageTemplate, {
    msg: msg.text,
    createdAt: moment(msg.createdAt).format("h:mm a"),
    username: msg.username, //moment is used to format the times
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("locationMessage", (url) => {
  console.log(url);
  const html = Mustache.render(locationTemplate, {
    msg: url.text,
    createdAt: moment(url.createdAt).format("h:mm a"),
    username: url.username,
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("sendLocation", (lat, long) => {
  console.log("Location : " + lat + ", " + long);
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });

  document.querySelector("#sidebar").innerHTML = html;
});
