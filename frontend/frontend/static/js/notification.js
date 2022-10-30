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
const notificationCenter = getElementById('notification_center');

socket.on('connect', async (message) => {
  console.log('CONNECTED TO NOTIFICATION SERVER');
});

/* global socket handlers */
socket.on('notification', (message) => {
  console.log('NOTIFY!');
  let note = document.createElement('div');
  note.id = 'notification';
  note.textContent = message;
  notificationCenter.appendChild(note);
});
