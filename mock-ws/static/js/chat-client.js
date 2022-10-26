window.getCookie = function (name) {
  var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
};

const socket = io('ws://localhost:1234', {
  // auth: {
  //   'jwt-access': getCookie('jwt-access'),
  // },
});
const getElementById = (id) => document.getElementById(id) || null;

//* get DOM element
const chattingBoxElement = getElementById('chatting_box');
const formElement = getElementById('chat_form');

socket.on('connect', (message) => {
  const userId = prompt('userId');
  socket.emit('new_user', userId);
});

/* global socket handlers */
socket.on('notification', (message) => {
  const note = document.createElement('div');
  note.textContent = message;
  note.style.background = '#fdcdef';
  chattingBoxElement.appendChild(note);
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
