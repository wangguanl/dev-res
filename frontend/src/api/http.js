import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

const instance = axios.create({
  baseURL,
  timeout: 15000,
});

instance.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message || err.message || '请求失败';
    return Promise.reject(new Error(msg));
  }
);

export default instance;
