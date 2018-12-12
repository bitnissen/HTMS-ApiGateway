import { send } from 'micro';

/**
 * Run a superstruct and if it fails, respond with a pretty error message and status code.
 * Otherwise return true.
 */
export default (struct, data, res) => {
  try {
    struct(data);
  } catch (e) {
    if (!res) return false;

    const reply = {
      success: false,
      message: 'Invalid or missing arguments in request.',
      code: 'INVALID_ARGS',
      errors: [],
    };

    e.errors.forEach((e2) => {
      reply.errors.push({
        field: e2.path.join('.'),
        failed_rule: e2.type || 'unexpected',
      });
    });

    send(res, 422, reply);
    return false;
  }

  return true;
};
