import { useState, useEffect } from 'react'
import ChatInterface from './components/ChatInterface'
import FileUpload from './components/FileUpload'
import './styles/index.css'

function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const [chatId, setChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [pdfName, setPdfName] = useState(null)

  // Load state from localStorage on component mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem('currentSessionId')
    const savedPdfName = localStorage.getItem('currentPdfName')
    const savedChatId = localStorage.getItem('currentChatId')
    const savedMessages = localStorage.getItem('chatMessages')
    
    if (savedSessionId) setSessionId(savedSessionId)
    if (savedPdfName) setPdfName(savedPdfName)
    if (savedChatId) setChatId(savedChatId)
    
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages))
      } catch (e) {
        console.error('Error parsing saved messages:', e)
      }
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('currentSessionId', sessionId)
    }
    if (pdfName) {
      localStorage.setItem('currentPdfName', pdfName)
    }
    if (chatId) {
      localStorage.setItem('currentChatId', chatId)
    }
    localStorage.setItem('chatMessages', JSON.stringify(messages))
  }, [sessionId, pdfName, chatId, messages])

  const clearChat = async () => {
    try {
      if (sessionId) {
        // Call API to clear session
        const response = await fetch('/api/session/clear', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId })
        });
        
        if (response.ok) {
          console.log('Session cleared successfully');
        }
      }
      
      // Clear local state
      setSessionId(null)
      setPdfName(null)
      setChatId(null)
      setMessages([])
      
      // Clear localStorage
      localStorage.removeItem('currentSessionId')
      localStorage.removeItem('currentPdfName')
      localStorage.removeItem('currentChatId')
      localStorage.removeItem('chatMessages')
    } catch (error) {
      console.error('Error clearing chat:', error)
    }
  }

  const handleUploadSuccess = (data) => {
    setSessionId(data.sessionId)
    setPdfName(data.filename)
    setChatId(null)
    setMessages([])
    setActiveTab('chat')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">AI PDF Chatbot</h1>
            <nav className="flex space-x-4 items-center">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'chat'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'upload'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Upload PDF
              </button>
              {activeTab === 'chat' && (pdfName || messages.length > 0) && (
                <button
                  onClick={clearChat}
                  className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-100"
                >
                  Clear Chat
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'chat' ? (
          <ChatInterface 
            chatId={chatId}
            setChatId={setChatId}
            messages={messages}
            setMessages={setMessages}
            sessionId={sessionId}
            pdfName={pdfName}
          />
        ) : (
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        )}
      </main>
    </div>
  )
}

export default App