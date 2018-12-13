import { json, send } from 'micro';
import { struct } from 'superstruct';
import validator from '@helpers/validator';
import postJson from '@helpers/postJson';

const validateReq = struct({
  api: 'string',
  payload: 'object?',
});

/**
 * Regular REST-approach.
 */
module.exports = async (req, res) => {
  const body = await json(req);
  if (!validator(validateReq, body, res)) return null;

  const response = await postJson(`${process.env.SYSEVENT}/trigger-event`, {
    event: `www.${body.api}`,
    payload: body.payload,
  });

  return send(res, response.status, response.data);
};
