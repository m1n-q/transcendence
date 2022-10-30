window.getCookie = function (name) {
  var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
};

const notiSocket = io('ws://localhost:11111', {
  auth: {
    access_token: getCookie('jwt-access'),
  },
});

//* get DOM element
const notificationCenter = document.getElementById('notification_center');

notiSocket.on('connect', async (message) => {
  console.log('CONNECTED TO NOTIFICATION SERVER');
});

/* global Socket handlers */
notiSocket.on('notification', (message) => {
  console.log('NOTIFY!');
  let note = document.createElement('div');
  note.id = 'notification';
  note.textContent = message;
  notificationCenter.appendChild(note);
});
