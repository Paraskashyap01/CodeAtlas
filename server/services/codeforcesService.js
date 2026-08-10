import axios from 'axios';

const CF_BASE = 'https://codeforces.com/api';

export const fetchCFData = async (handle) => {
  const [userInfoResponse, ratingResponse, submissionsResponse] = await Promise.all([
    axios.get(`${CF_BASE}/user.info`, { params: { handles: handle } }),
    axios.get(`${CF_BASE}/user.rating`, { params: { handle } }),
    axios.get(`${CF_BASE}/user.status`, { params: { handle, from: 1, count: 1000 } }),
  ]);

  if (userInfoResponse.data.status !== 'OK') {
    throw new Error('Unable to fetch Codeforces user info');
  }

  return {
    handle,
    userInfo: userInfoResponse.data.result[0] || null,
    ratingHistory: ratingResponse.data.status === 'OK' ? ratingResponse.data.result : [],
    submissions: submissionsResponse.data.status === 'OK' ? submissionsResponse.data.result : [],
    fetchedAt: new Date(),
  };
};



