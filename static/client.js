(() => {
  const waitingListeners = {};
  let socket = null;

  const agw = async (api, payload) => {
    if (!socket) throw new Error('agw.init(url) has not been called');

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

  agw.init = (url) => {
    if (socket) return;

    // eslint-disable-next-line no-undef
    socket = io(url);

    socket.on('api-reply', (data) => {
      const listener = waitingListeners[data.uid];
      if (!listener) return; // invalid / maybe called multiple times

      listener(data.payload, data.status);
      delete waitingListeners[data.uid];
    });
  };

  // eslint-disable-next-line no-undef
  window.agw = agw;
})();
