import { text, json, send } from 'micro';
import qs from 'query-string';
import postJson from '@helpers/postJson';

/**
 * Regular REST-approach.
 */
module.exports.GET = async (req, res) => {
  const api = req.params.id;
  const parsedUrl = qs.parseUrl(req.url);

  const response = await postJson(`${process.env.SYSEVENT}/trigger-event`, {
    event: `www.${api}`,
    payload: parsedUrl.query,
  });

  return send(res, response.status, response.data);
};

module.exports.POST = async (req, res) => {
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

  return send(res, response.status, response.data);
};
