async function getAllUsers() {
  let response;
  try {
    response = await fetch('http://localhost:3000/test/user-list');
  } catch (e) {
    console.log(e);
  }

  const res = await response.json();
  const users = res.data;

  let ret = [];

  for (user of users) {
    const { nickname: label, id: value } = user;
    ret.push({ label, value });
  }
  return ret;
}

$(async function () {
  const users = await getAllUsers();
  // var availableUsers = Object.keys(users);

  $('#users').autocomplete({
    source: users,
    select: function (ev, ui) {
      $('#users').val(ui.item.label);
      $('#users_id').val(ui.item.value);
      return false;
    },
    focus: function (ev, ui) {
      $('#users').val(ui.item.label);
      return false;
    },
  });
});
