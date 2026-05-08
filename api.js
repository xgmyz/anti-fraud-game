// GitHub Pages 版本 - 后端API请求会静默失败，不影响前端功能
const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') 
    ? 'http://localhost:3000/api' 
    : 'http://localhost:3000/api'; // GitHub Pages上后端不可用

function getToken() {
  return localStorage.getItem('antiFraudToken');
}

function setToken(token) {
  localStorage.setItem('antiFraudToken', token);
}

function removeToken() {
  localStorage.removeItem('antiFraudToken');
}

async function request(url, options = {}) {
  // 在GitHub Pages上，后端不可用，直接返回失败但不报错
  if (location.hostname.includes('github.io') || location.hostname === '') {
    return { success: false, message: '后端服务未部署' };
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    const token = getToken();
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const res = await fetch(API_BASE + url, {
      ...options,
      headers
    });

    const data = await res.json();
    return data;
  } catch (err) {
    // 请求失败时静默返回，不报错
    return { success: false, message: '网络错误' };
  }
}

const api = {
  auth: {
    register: (username, password, nickname) => request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, nickname })
    }),
    login: (username, password) => request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
    me: () => request('/auth/me')
  },
  progress: {
    get: () => request('/progress'),
    save: (progress) => request('/progress', {
      method: 'POST',
      body: JSON.stringify(progress)
    })
  },
  leaderboard: {
    get: (type = 'global', limit = 50) => request(`/leaderboard?type=${type}&limit=${limit}`),
    submit: (total_score, total_time, difficulty) => request('/leaderboard', {
      method: 'POST',
      body: JSON.stringify({ total_score, total_time, difficulty })
    })
  }
};
