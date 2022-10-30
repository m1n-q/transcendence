window.getCookie = function (name) {
  var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
};

const socket = io('ws://localhost:9999', {
  auth: {
    access_token: getCookie('jwt-access'),
  },
});
const getElementById = (id) => document.getElementById(id) || null;

//* get DOM element
const chatBox = getElementById('chat_box');
const formElement = getElementById('chat_form');

socket.on('connect', async (message) => {
  console.log('CONNECTED TO CHAT SERVER');
});

/* global socket handlers */
socket.on('message', (message) => {
  let message = document.createElement('div');
  message.id = 'chat_box';
  message.textContent = message;
  chatBox.appendChild(message);
});

/* form event handler */
const formHandler = (event) => {
  event.preventDefault();
  const inputValue = event.target.elements[0].value;
  if (inputValue) {
    socket.emit('publish', { message: inputValue });
    event.target.elements[0].value = '';
  }
};

/* main */
formElement.addEventListener('submit', formHandler);
