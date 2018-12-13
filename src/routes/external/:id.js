import { text, json, send } from 'micro';
import qs from 'query-string';
import postJson from '@helpers/postJson';

const getHandler = async (req) => {
  const api = req.params.id;
  const parsedUrl = qs.parseUrl(req.url);

  return postJson(`${process.env.SYSEVENT}/trigger-event`, {
    event: `www.${api}`,
    payload: parsedUrl.query,
  });
}

const postHandler = async (req) => {
  const api = req.params.id;
  let payload = null;
  try {
    payload = await json(req);
  } catch (e) {
    payload = { raw: await text(req) };
  }

  const response = await postJson(`${process.env.SYSEVENT}/trigger-event`, {
    payload,
    event: `www.${api}`,
  });

  return response;
}

/**
 * Regular REST-approach.
 */
module.exports.GET = async (req, res) => {
  const output = await getHandler(req);
  return send(res, output.status, output.data);
};

module.exports.POST = async (req, res) => {
  const output = await postHandler(req);
  return send(res, output.status, output.data);
};

/**
 * Return the underlying handlers as well, which doesn't actually send anything.
 */
module.exports.getHandler = getHandler;
module.exports.postHandler = postHandler;
