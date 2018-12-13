import { struct } from 'superstruct';
import validator from '@helpers/validator';
import postJson from '@helpers/postJson';

const validateReq = struct({
  uid: 'string',
  api: 'string',
  payload: 'object?',
});

module.exports = async (socket) => {
  // test-service
  socket.on('echo', (data) => {
    socket.emit('echo', data);
  });

  // wrap the call-api and now include a UID
  socket.on('call-api', async (data) => {
    if (!validator(validateReq, data)) return null;

    const { uid, api, payload } = data;

    const response = await postJson(`${process.env.SYSEVENT}/trigger-event`, {
      payload,
      event: `www.${api}`,
    });

    socket.emit('api-reply', {
      uid,
      status: response.status,
      payload: response.data,
    });

    return null;
  });
};
