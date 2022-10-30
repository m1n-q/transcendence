window.getCookie = function (name) {
  var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
};

const chatSocket = io('ws://localhost:9999', {
  auth: {
    access_token: getCookie('jwt-access'),
  },
});

//* get DOM element
const chatBox = document.getElementById('chat_box');
const formElement = document.getElementById('chat_form');

chatSocket.on('connect', async (message) => {
  console.log('CONNECTED TO CHAT SERVER');
});

/* global socket handlers */
chatSocket.on('message', (message) => {
  let messageElem = document.createElement('div');
  messageElem.id = 'chat_box';
  messageElem.textContent = message;
  chatBox.appendChild(messageElem);
});

/* form event handler */
const formHandler = (event) => {
  event.preventDefault();
  const inputValue = event.target.elements[0].value;
  if (inputValue) {
    chatSocket.emit('publish', { message: inputValue });
    event.target.elements[0].value = '';
  }
};

/* main */
formElement.addEventListener('submit', formHandler);
