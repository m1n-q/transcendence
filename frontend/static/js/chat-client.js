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
  const user = message.user;

  let messageBoxElem = document.createElement('div');
  let messageElem = document.createElement('div');
  let profButton = document.createElement('button');
  let profImg = document.createElement('img');
  let nickname = document.createElement('div');

  messageElem.id = 'chat_message';
  messageElem.textContent = message.payload;

  profImg.id = 'prof_img';
  profImg.src = user.profImg !== 'undefined' ? user.profImg : '123';

  profButton.id = 'prof_img_button';
  profButton.appendChild(profImg);

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

/* main */
formElement.addEventListener('submit', formHandler);
