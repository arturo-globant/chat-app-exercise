const generateMsgObj = (username, text) => {
  return {
    username,
    text,
    createdAt: new Date().toUTCString(),
  };
};

module.exports = {
  generateMsgObj,
};
