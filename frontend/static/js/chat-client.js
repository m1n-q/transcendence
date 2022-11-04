window.getCookie = function (name) {
  var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
};

const chatSocket = io('ws://localhost:9999', {
  auth: {
    access_token: getCookie('jwt-access'),
  },
});

chatSocket.on('connect', async (message) => {
  console.log('CONNECTED TO CHAT SERVER');
});

/* global socket handlers */
chatSocket.on('message', (message) => {
  const chatBox = document.getElementById('chat_box');

  const user = message.user;

  let messageBoxElem = document.createElement('div');
  let messageElem = document.createElement('div');
  let profButton = document.createElement('button');
  let prof_img = document.createElement('img');
  let nickname = document.createElement('div');

  messageElem.id = 'chat_message';
  messageElem.textContent = message.payload;

  prof_img.id = 'prof_img';
  prof_img.src = user.prof_img !== 'undefined' ? user.prof_img : '123';

  profButton.id = 'prof_img_button';
  profButton.appendChild(prof_img);

  messageBoxElem.id = 'chat_message_box';
  messageBoxElem.appendChild(profButton);
  messageBoxElem.appendChild(messageElem);

  chatBox.appendChild(messageBoxElem);
});

/* form event handler */
const formHandler = (event) => {
  event.preventDefault();
  const inputValue = event.target.elements[0].value;
  if (inputValue) {
    chatSocket.emit('publish', { payload: inputValue });
    event.target.elements[0].value = '';
  }
};

const formElement = document.getElementById('chat_form');
formElement.addEventListener('submit', formHandler);
