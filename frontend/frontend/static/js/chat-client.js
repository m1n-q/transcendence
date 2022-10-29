window.getCookie = function (name) {
  var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
};

const socket = io('ws://localhost:11111', {
  auth: {
    access_token: getCookie('jwt-access'),
  },
});
const getElementById = (id) => document.getElementById(id) || null;

//* get DOM element
const chatBox = getElementById('chat_box');
const notificationCenter = getElementById('notification_center');
const formElement = getElementById('chat_form');

socket.on('connect', async (message) => {
  console.log('CONNECTED TO SERVER');
});

/* global socket handlers */
socket.on('notification', (message) => {
  console.log('NOTIFY!');
  let note = document.createElement('div');
  note.id = 'notification';
  note.textContent = message;
  notificationCenter.appendChild(note);
});

/* form event handler */
const formHandler = (event) => {
  event.preventDefault();
  const inputValue = event.target.elements[0].value;
  if (inputValue) {
    socket.emit('new_message', { message: inputValue });
    event.target.elements[0].value = '';
  }
};

/* main */
formElement.addEventListener('submit', formHandler);
