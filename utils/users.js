const users = [];

const addUser = ({ id, username, room }) => {
  //clean the data
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  if (!username || !room) {
    return {
      error: "Username and room are required",
    };
  }

  const existingUser = users.find((user) => {
    return user.room === room && user.username === username;
  });

  if (existingUser) {
    return {
      error: "Username already used",
    };
  }

  const user = { id, username, room };
  users.push(user);
  return { user };
};

const removeUser = ({ id }) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  } else {
    return {
      error: "No user found",
    };
  }
};

const getUser = ({ id }) => {
  return users.find((user) => user.id === id);
};

const getUsersInRoom = ({ room }) => {
  return users.filter((user) => user.room == room);
};

module.exports = {
  addUser,
  getUser,
  getUsersInRoom,
  removeUser,
};
