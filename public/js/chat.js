const socket = io();

const messageForm = document.getElementById("message-form");
const inputMessage = document.getElementById("input-message");
const sendMessageBtn = document.getElementById("send-message");
const messageArea = document.getElementById("message-area");
const roomsName = document.getElementById("rooms-name");
const usersList = document.getElementById("users-list");

const params = new URLSearchParams(window.location.search);
const entries = params.entries();
const joinObj = Object.fromEntries(entries);

const autoScroll = () => {
  // New message element
  const newMessage = messageArea.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = messageArea.offsetHeight;

  // Height of messages container
  const containerHeight = messageArea.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = messageArea.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messageArea.scrollTop = messageArea.scrollHeight;
  }
};

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  sendMessageBtn.setAttribute("disabled", "disabled");

  const message = inputMessage.value;
  socket.emit("sendMessage", message, (error) => {
    sendMessageBtn.removeAttribute("disabled");
    inputMessage.value = "";
    inputMessage.focus();

    if (error) {
      return console.log(error);
    }
    console.log("The message was delivered");
  });
});

const sendLocation = document.getElementById("send-location");

sendLocation.addEventListener("click", (e) => {
  const { geolocation } = navigator;

  if (!geolocation) {
    return alert("Geolocation is not supported by your browser");
  }

  sendLocation.setAttribute("disabled", "disabled");

  geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        lat: position.coords.latitude,
        long: position.coords.longitude,
      },
      () => {
        sendLocation.removeAttribute("disabled");
      }
    );
  });
});

socket.on("message", (textObj) => {
  const { username, text, createdAt } = textObj;
  const div = document.createElement("div");
  div.classList.add("message");

  const pMeta = document.createElement("p");

  const name = document.createElement("span");
  name.innerText = username;
  name.classList.add("message__name");

  const date = document.createElement("span");
  date.innerText = `${createdAt.toString(10)}: `;
  date.classList.add("message__meta");

  pMeta.append(name, date);

  const pMessage = document.createElement("p");
  pMessage.innerText = text;
  div.append(pMeta, pMessage);

  messageArea.appendChild(div);
  autoScroll();
});

socket.on("userStatus", (text) => {
  const p = document.createElement("p");
  p.innerText = text;
  p.style.fontStyle = "italic";

  messageArea.appendChild(p);
  autoScroll;
});

socket.on("locationMessage", (textObj) => {
  const { text: url, createdAt } = textObj;

  const div = document.createElement("div");
  div.classList.add("message");

  const pMeta = document.createElement("p");

  const name = document.createElement("span");
  name.innerText = "Some User Name";
  name.classList.add("message__name");

  const date = document.createElement("span");
  date.innerText = `${createdAt.toString(10)}: `;
  date.classList.add("message__meta");

  pMeta.append(name, date);

  const pUrl = document.createElement("p");

  const a = document.createElement("a");
  a.href = url;
  a.innerText = "Users location";
  a.target = "_blank";

  pUrl.append(a);

  div.append(pMeta, pUrl);

  messageArea.appendChild(div);
  autoScroll;
});

socket.on("roomData", ({ room, users }) => {
  roomsName.innerText = room;
  if (!!users.length) {
    usersList.textContent = "";
    users.forEach((user) => {
      const li = document.createElement("li");
      li.innerText = user.username;
      li.classList.add("users");
      usersList.append(li);
    });
  }
});

socket.emit("join", joinObj, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
