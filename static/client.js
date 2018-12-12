(() => {
  // eslint-disable-next-line no-undef
  const socket = io();

  const waitingListeners = {};

  const agw = async (api, payload) => {
    const uid = `${(new Date()).getTime()}-${Math.random()}`;

    const promise = new Promise((resolver) => {
      waitingListeners[uid] = resolver;
    });

    socket.emit('call-api', {
      uid,
      api,
      payload,
    });

    return promise;
  };

  socket.on('api-reply', (data) => {
    const listener = waitingListeners[data.uid];
    if (!listener) return; // invalid / maybe called multiple times

    listener(data.payload);
    delete waitingListeners[data.uid];
  });

  // eslint-disable-next-line no-undef
  window.agw = agw;
})();
