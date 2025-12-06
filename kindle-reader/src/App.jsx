import React, { useState, useCallback } from 'react'
import PDFUploader from './components/PDFUploader'
import Reader from './components/Reader'
import { BookOpen } from 'lucide-react'

function App() {
  const [pdfData, setPdfData] = useState(null)
  const [fileName, setFileName] = useState('')

  const handleFileLoad = useCallback((data, name) => {
    setPdfData(data)
    setFileName(name)
  }, [])

  const handleClose = useCallback(() => {
    setPdfData(null)
    setFileName('')
  }, [])

  return (
    <div className="h-full w-full bg-kindle-cream">
      {!pdfData ? (
        <div className="h-full flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-center gap-3 py-6 px-4 border-b border-kindle-sepia">
            <BookOpen className="w-8 h-8 text-kindle-text" />
            <h1 className="text-2xl md:text-3xl font-serif text-kindle-text">
              Kindle PDF Reader
            </h1>
          </header>
          
          {/* Upload Area */}
          <main className="flex-1 flex items-center justify-center p-4">
            <PDFUploader onFileLoad={handleFileLoad} />
          </main>
          
          {/* Features */}
          <footer className="p-6 border-t border-kindle-sepia">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-lg font-semibold text-kindle-text mb-4 text-center">
                Features
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm text-kindle-text/80">
                <div className="p-3 bg-kindle-sepia/30 rounded-lg">
                  <p className="font-medium">📱 Touch Swipe</p>
                  <p className="text-xs mt-1">Swipe to turn pages</p>
                </div>
                <div className="p-3 bg-kindle-sepia/30 rounded-lg">
                  <p className="font-medium">📜 Scroll Mode</p>
                  <p className="text-xs mt-1">Continuous scrolling</p>
                </div>
                <div className="p-3 bg-kindle-sepia/30 rounded-lg">
                  <p className="font-medium">🌙 Dark Mode</p>
                  <p className="text-xs mt-1">Easy on eyes</p>
                </div>
                <div className="p-3 bg-kindle-sepia/30 rounded-lg">
                  <p className="font-medium">📐 Responsive</p>
                  <p className="text-xs mt-1">Mobile & Tablet</p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        <Reader 
          pdfData={pdfData} 
          fileName={fileName}
          onClose={handleClose} 
        />
      )}
    </div>
  )
}

export default App
