import { useState } from 'react'
import { uploadPDF } from '../services/api'

const FileUpload = () => {
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState('')

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setMessage('')
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('pdf', file)

      const response = await uploadPDF(formData)
      setMessage(`File uploaded successfully! Processed ${response.chunks} chunks.`)
      setFile(null)
    } catch (error) {
      console.error('Upload error:', error)
      setMessage('Error uploading file. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Upload PDF Document</h2>
      
      <form onSubmit={handleUpload} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select PDF File
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={isUploading}
          />
        </div>

        {file && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Selected file: ${file.name}</p>
            <p className="text-xs text-gray-500 mt-1">Size: ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || isUploading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Upload PDF'}
        </button>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes('Error') 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}
      </form>

      <div className="mt-8 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">How it works:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Upload a PDF document using the form above</li>
          <li>The system will extract and process the text content</li>
          <li>Switch to the Chat tab to ask questions about your document</li>
          <li>The AI will use the content of your PDF to answer questions</li>
        </ul>
      </div>
    </div>
  )
}

export default FileUpload