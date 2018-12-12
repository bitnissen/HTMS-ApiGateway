import axios from 'axios';

async function postJson(url, data) {
  try {
    const response = await axios({
      url,
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify(data),
      validateStatus: status => status >= 200 && status <= 499,
    });
    return {
      data: response.data,
      status: response.status,
    };
  } catch (error) {
    return {
      data: error.message || 'Unknown error',
      status: error.status || 503,
    };
  }
}

export default postJson;
