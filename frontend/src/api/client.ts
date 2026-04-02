import axios from 'axios'

const TOKEN_KEY = 'palha_token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

// Injeta Bearer token em todas as requisições
api.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Trata erros globalmente
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Token expirado ou inválido — força re-login
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('palha_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    const detail = err.response?.data?.detail
    const msg = Array.isArray(detail)
      ? detail[0]?.msg
      : (detail || 'Ocorreu um erro inesperado')
    return Promise.reject(new Error(msg))
  }
)

export default api
