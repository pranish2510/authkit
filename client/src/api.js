import axios from 'axios'

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', withCredentials: true })
let token = null
let refreshPromise = null
export const setAccessToken = (value) => { token = value }
export const getAccessToken = () => token

api.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(undefined, async (error) => {
  const request = error.config
  if (error.response?.status !== 401 || request?._retried || request?.url?.includes('/auth/refresh')) throw error
  request._retried = true
  try {
    if (!refreshPromise) refreshPromise = api.get('/auth/csrf').then(({ data }) => api.post('/auth/refresh', {}, { headers: { 'X-CSRF-Token': data.data.csrfToken } })).finally(() => { refreshPromise = null })
    const response = await refreshPromise
    token = response.data.data.accessToken
    request.headers.Authorization = `Bearer ${token}`
    return api(request)
  } catch (refreshError) { token = null; throw refreshError }
})

export const getCsrf = async () => (await api.get('/auth/csrf')).data.data.csrfToken
