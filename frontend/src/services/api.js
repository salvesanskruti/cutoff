import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const msg =
        error.response.data?.error ||
        error.response.data?.message ||
        `Server error ${error.response.status}`;
      return Promise.reject(new Error(msg));
    }
  }
);
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out. Is the backend running?'));
    }
    return Promise.reject(new Error('Cannot reach the server. Please check your connection.'));
  }
);

// ── Predict ─────────────────────────────────────────────
export const predictService = {
  predictColleges: (score, category, seatType, branchNames = [], includeReach = true, topN = 50) =>
    api.post('/predict/colleges', { score, category, seatType, branchNames, includeReach, topN }),

  getChances: (collegeId, branchId, category, seatType, score) =>
    api.post('/predict/chances', { collegeId, branchId, category, seatType, score }),
};

// ── Filters ─────────────────────────────────────────────
export const filterService = {
  getBranches:     () => api.get('/filters/branches'),
  getCategories:   () => api.get('/filters/categories'),
  getSeatTypes:    () => api.get('/filters/seat-types'),
  getCollegeNames: () => api.get('/filters/college-names'),
};

// ── Colleges ─────────────────────────────────────────────
export const collegeService = {
  getColleges: (page = 1, limit = 50) =>
    api.get('/colleges', { params: { page, limit } }),

  getCollege:  (collegeId) => api.get(`/colleges/${collegeId}`),
  getHistory:  (collegeId) => api.get(`/colleges/${collegeId}/history`),
};

// ── Compare — convenience function used by ComparePage ──
/** GET /api/colleges/compare?ids=id1,id2,id3 */
export const getCollegesCompare = async (ids) => {
  const response = await api.get('/colleges/compare', { params: { ids } });
  return response.data;
};

// ── College Detail — convenience function ───────────────
/** GET /api/colleges/:collegeId  (returns full profile) */
export const getCollegeDetail = async (collegeId) => {
  const response = await api.get(`/colleges/${collegeId}`);
  return response.data;
};

// ── Health ───────────────────────────────────────────────
export const healthService = {
  check: () => api.get('/health'),
};

export default api;