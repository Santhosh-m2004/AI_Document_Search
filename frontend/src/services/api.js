import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const sendMessage = async (message, chatId, sessionId) => {
  const response = await api.post('/chat', { message, chatId, sessionId })
  return response.data
}

export const uploadPDF = async (formData) => {
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const getChatHistory = async (chatId) => {
  const response = await api.get(`/chat/${chatId}`)
  return response.data
}

export const clearSession = async (sessionId) => {
  const response = await api.post('/session/clear', { sessionId })
  return response.data
}

export default api