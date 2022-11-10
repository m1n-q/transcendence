window.getCookie = function (name) {
  var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
};

/* send access_token from cookie */
const chatSocket = io('ws://localhost:9999', {
  auth: {
    access_token: getCookie('jwt-access'),
  },
});

/* on connection, need to notiify server which room client joined */
const roomName = 'TESTROOM';
chatSocket.on('connect', async (message) => {
  console.log('CONNECTED TO CHAT SERVER');
  chatSocket.emit('join', { room: roomName });
});

/* render message box */
function makeMessageBox(message, other = true) {
  let chatBox;
  chatBox = document.getElementsByClassName('chat_box')[0];

  const sender = message.sender;

  let messageBoxElem = document.createElement('div');
  let messageElem = document.createElement('div');
  let profButton = document.createElement('button');
  let prof_img = document.createElement('img');
  let nickname = document.createElement('div');

  messageElem.className = 'chat_message';
  messageElem.textContent = message.payload;

  prof_img.className = 'prof_img';
  prof_img.src = sender.prof_img !== 'undefined' ? sender.prof_img : '123';

  profButton.className = 'prof_img_button';
  profButton.appendChild(prof_img);

  messageBoxElem.className = 'chat_message_box';
  if (other) {
    messageBoxElem.id = 'other';
    messageBoxElem.appendChild(messageElem);
    messageBoxElem.appendChild(profButton);
  } else {
    messageBoxElem.appendChild(profButton);
    messageBoxElem.appendChild(messageElem);
  }

  chatBox.appendChild(messageBoxElem);
}

/* global socket handlers */

/* render received message */
chatSocket.on('subscribe', (message) => {
  makeMessageBox(message);
});

/* render sended message */
chatSocket.on('subscribe_self', (message) => {
  makeMessageBox(message, false);
});

/* chat-form event handler */
const formHandler = (event) => {
  event.preventDefault();
  const inputValue = event.target.elements[0].value;
  if (inputValue) {
    chatSocket.emit('publish', { room: roomName, payload: inputValue });
    event.target.elements[0].value = '';
  }
};

const formElement = document.getElementsByClassName('chat_form')[0];
formElement.addEventListener('submit', formHandler);
