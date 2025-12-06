import React, { useState, useCallback } from 'react'
import { Upload, FileText, Loader2 } from 'lucide-react'

function PDFUploader({ onFileLoad }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = useCallback(async (file) => {
    if (!file) return
    
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const arrayBuffer = await file.arrayBuffer()
      onFileLoad(arrayBuffer, file.name)
    } catch (err) {
      setError('Failed to load PDF file')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [onFileLoad])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback((e) => {
    const file = e.target.files[0]
    handleFile(file)
  }, [handleFile])

  return (
    <div className="w-full max-w-lg mx-auto">
      <label
        className={`
          relative flex flex-col items-center justify-center
          w-full h-64 md:h-80
          border-2 border-dashed rounded-2xl
          cursor-pointer
          transition-all duration-200
          ${isDragging 
            ? 'border-amber-600 bg-amber-50 scale-[1.02]' 
            : 'border-kindle-text/30 hover:border-kindle-text/50 hover:bg-kindle-sepia/20'
          }
          ${isLoading ? 'pointer-events-none opacity-70' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleInputChange}
          disabled={isLoading}
        />
        
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          {isLoading ? (
            <>
              <Loader2 className="w-12 h-12 text-kindle-text animate-spin" />
              <p className="text-kindle-text font-medium">Loading PDF...</p>
            </>
          ) : (
            <>
              <div className="p-4 bg-kindle-sepia/50 rounded-full">
                {isDragging ? (
                  <FileText className="w-10 h-10 text-amber-700" />
                ) : (
                  <Upload className="w-10 h-10 text-kindle-text" />
                )}
              </div>
              <div>
                <p className="text-lg font-medium text-kindle-text">
                  {isDragging ? 'Drop your PDF here' : 'Upload a PDF'}
                </p>
                <p className="text-sm text-kindle-text/60 mt-1">
                  Drag & drop or tap to select
                </p>
              </div>
            </>
          )}
        </div>
      </label>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-center">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}

export default PDFUploader
