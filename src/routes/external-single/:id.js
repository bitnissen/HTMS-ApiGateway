import { send } from 'micro';

const { getHandler, postHandler } = require('@routes/external/:id');

module.exports.GET = async (req, res) => {
  const output = await getHandler(req);
  return send(res, output.status, output.data[0]);
};

module.exports.POST = async (req, res) => {
  const output = await postHandler(req);
  return send(res, output.status, output.data[0]);
};
