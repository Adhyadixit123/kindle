import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ZoomIn,
  ZoomOut,
  Menu,
  Highlighter,
  Move,
  RotateCcw
} from 'lucide-react'
import ReaderSettings from './ReaderSettings'
import PageRenderer from './PageRenderer'

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

function Reader({ pdfData, fileName, onClose }) {
  const [pdf, setPdf] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [theme, setTheme] = useState('light') // light, sepia, dark
  const [viewMode, setViewMode] = useState('page') // page, scroll
  const [zoom, setZoom] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [fitMode, setFitMode] = useState('width') // 'width', 'height', 'page'
  
  // Pan state (now using native scroll, keeping for reset button check)
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 })
  
  // Highlighter state
  const [highlights, setHighlights] = useState(() => {
    // Load from localStorage
    try {
      const saved = localStorage.getItem(`pdf-highlights-${fileName}`)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [highlightColor, setHighlightColor] = useState(null) // null = not highlighting
  const [showHighlightToolbar, setShowHighlightToolbar] = useState(false)

  // Save highlights to localStorage
  useEffect(() => {
    if (fileName && highlights.length > 0) {
      localStorage.setItem(`pdf-highlights-${fileName}`, JSON.stringify(highlights))
    }
  }, [highlights, fileName])
  
  const highlightColors = [
    { name: 'Yellow', color: '#FFEB3B' },
    { name: 'Green', color: '#4CAF50' },
    { name: 'Blue', color: '#2196F3' },
    { name: 'Pink', color: '#E91E63' },
    { name: 'Orange', color: '#FF9800' }
  ]
  
  const containerRef = useRef(null)
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 })
  const touchEndRef = useRef({ x: 0, y: 0 })
  const lastTouchDistance = useRef(0)
  const controlsTimeoutRef = useRef(null)

  // Load PDF
  useEffect(() => {
    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: pdfData })
        const pdfDoc = await loadingTask.promise
        setPdf(pdfDoc)
        setTotalPages(pdfDoc.numPages)
        setIsLoading(false)
      } catch (err) {
        console.error('Error loading PDF:', err)
        setIsLoading(false)
      }
    }
    loadPdf()
  }, [pdfData])

  // Theme colors
  const themeStyles = {
    light: {
      bg: 'bg-white',
      text: 'text-gray-900',
      controls: 'bg-white/95',
      border: 'border-gray-200'
    },
    sepia: {
      bg: 'bg-kindle-cream',
      text: 'text-kindle-text',
      controls: 'bg-kindle-cream/95',
      border: 'border-kindle-sepia'
    },
    dark: {
      bg: 'bg-gray-900',
      text: 'text-gray-100',
      controls: 'bg-gray-800/95',
      border: 'border-gray-700'
    }
  }

  const currentTheme = themeStyles[theme]

  // Navigation
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }, [currentPage, totalPages])

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }, [currentPage])

  // Zoom functions
  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(3, prev + 0.25))
  }, [])

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(0.5, prev - 0.25))
  }, [])

  // Reset scroll when page changes
  useEffect(() => {
    const scrollContainer = document.getElementById('page-scroll-container')
    if (scrollContainer) {
      scrollContainer.scrollTo(0, 0)
    }
    setScrollPosition({ x: 0, y: 0 })
  }, [currentPage])

  // Track scroll position for reset button
  useEffect(() => {
    const scrollContainer = document.getElementById('page-scroll-container')
    if (!scrollContainer) return
    
    const handleScroll = () => {
      setScrollPosition({
        x: scrollContainer.scrollLeft,
        y: scrollContainer.scrollTop
      })
    }
    
    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [pdf])

  const resetPan = useCallback(() => {
    // Scroll to top-center of zoomed content
    const scrollContainer = document.getElementById('page-scroll-container')
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        left: (scrollContainer.scrollWidth - scrollContainer.clientWidth) / 2,
        behavior: 'smooth'
      })
    }
  }, [])

  // Add highlight handler
  const handleAddHighlight = useCallback((highlight) => {
    setHighlights(prev => [...prev, highlight])
    // Clear selection
    window.getSelection()?.removeAllRanges()
  }, [])

  // Mouse/touch handlers - simplified since native scroll handles panning
  const handleMouseDown = useCallback(() => {}, [])
  const handleMouseMove = useCallback(() => {}, [])
  const handleMouseUp = useCallback(() => {}, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewMode === 'page') {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          nextPage()
        } else if (e.key === 'ArrowLeft') {
          prevPage()
        }
      }
      if (e.key === 'Escape') {
        setShowSettings(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewMode, nextPage, prevPage])

  // Touch event listeners for pinch zoom and swipe navigation
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        // Pinch start - prevent default to handle zoom
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy)
      } else if (e.touches.length === 1 && zoom <= 1) {
        // Track for swipe navigation only when not zoomed
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now()
        }
        touchEndRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
      // When zoomed with 1 finger, don't interfere - let native scroll work
    }

    const onTouchMove = (e) => {
      if (e.touches.length === 2) {
        // Pinch zoom - prevent default
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (lastTouchDistance.current > 0) {
          const scale = distance / lastTouchDistance.current
          if (Math.abs(scale - 1) > 0.02) {
            setZoom(prev => {
              const newZoom = prev * scale
              return Math.min(3, Math.max(0.5, newZoom))
            })
            lastTouchDistance.current = distance
          }
        }
      } else if (e.touches.length === 1 && zoom <= 1) {
        // Track for swipe only when not zoomed
        touchEndRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        }
      }
      // When zoomed with 1 finger, don't prevent default - let scroll work
    }

    const onTouchEnd = (e) => {
      // Swipe navigation only when not zoomed
      if (e.touches.length === 0 && viewMode === 'page' && zoom <= 1) {
        const deltaX = touchStartRef.current.x - touchEndRef.current.x
        const deltaY = touchStartRef.current.y - touchEndRef.current.y
        const deltaTime = Date.now() - touchStartRef.current.time
        
        if (deltaTime < 300 && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
          if (deltaX > 0) nextPage()
          else prevPage()
        }
      }
      lastTouchDistance.current = 0
    }

    // Only use passive: false for pinch zoom detection
    container.addEventListener('touchstart', onTouchStart, { passive: false })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
    }
  }, [zoom, viewMode, nextPage, prevPage])

  // Toggle controls visibility
  const handleTap = useCallback((e) => {
    // Don't toggle if clicking on buttons or settings
    if (e.target.closest('button') || e.target.closest('.settings-panel')) return
    
    setShowControls(prev => !prev)
    
    // Auto-hide after 3 seconds
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }, [])

  // Progress percentage
  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0

  if (isLoading) {
    return (
      <div className={`h-full flex items-center justify-center ${currentTheme.bg}`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className={`mt-4 ${currentTheme.text}`}>Loading book...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`h-full flex flex-col ${currentTheme.bg} transition-colors duration-300`}
    >
      {/* Top Controls */}
      <header 
        className={`
          fixed top-0 left-0 right-0 z-50
          flex items-center justify-between px-4 py-3
          ${currentTheme.controls} ${currentTheme.border} border-b
          backdrop-blur-sm
          transition-transform duration-300
          ${showControls ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
        <button 
          onClick={onClose}
          className={`p-2 rounded-full hover:bg-black/10 ${currentTheme.text}`}
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
        
        <h2 className={`flex-1 text-center truncate px-4 font-medium ${currentTheme.text}`}>
          {fileName.replace('.pdf', '')}
        </h2>
        
        <button 
          onClick={() => setShowSettings(true)}
          className={`p-2 rounded-full hover:bg-black/10 ${currentTheme.text}`}
          aria-label="Settings"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Highlight Toolbar */}
      {showHighlightToolbar && (
        <div 
          className={`
            fixed top-16 left-1/2 -translate-x-1/2 z-50
            flex items-center gap-2 px-4 py-2 rounded-full
            ${currentTheme.controls} shadow-lg border ${currentTheme.border}
          `}
        >
          <span className={`text-xs font-medium ${currentTheme.text} mr-2`}>Highlight:</span>
          {highlightColors.map((c) => (
            <button
              key={c.color}
              onClick={() => setHighlightColor(highlightColor === c.color ? null : c.color)}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${
                highlightColor === c.color ? 'scale-125 border-gray-800' : 'border-transparent hover:scale-110'
              }`}
              style={{ backgroundColor: c.color }}
              title={c.name}
            />
          ))}
          <button
            onClick={() => {
              setHighlightColor(null)
              setShowHighlightToolbar(false)
            }}
            className={`ml-2 p-1 rounded-full hover:bg-black/10 ${currentTheme.text}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Reading Area - FULL SCREEN */}
      <main 
        ref={containerRef}
        className="flex-1"
        style={{ 
          paddingTop: showControls ? '56px' : '0', 
          paddingBottom: showControls ? '80px' : '0',
          overflow: 'hidden',
          touchAction: zoom > 1 ? 'auto' : 'none'
        }}
        onClick={handleTap}
      >
        {viewMode === 'page' ? (
          <div 
            id="page-scroll-container"
            style={{
              width: '100%',
              height: '100%',
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y'
            }}
          >
            <PageRenderer 
              pdf={pdf}
              pageNumber={currentPage}
              zoom={zoom}
              theme={theme}
              fitMode={fitMode}
              highlights={highlights}
              highlightColor={highlightColor}
              onAddHighlight={handleAddHighlight}
            />
          </div>
        ) : (
          <div className="w-full h-full overflow-auto">
            {Array.from({ length: totalPages }, (_, i) => (
              <div key={i + 1} className="w-full mb-2">
                <PageRenderer 
                  pdf={pdf}
                  pageNumber={i + 1}
                  zoom={zoom}
                  theme={theme}
                  fitMode="width"
                  highlights={highlights}
                  highlightColor={highlightColor}
                  onAddHighlight={handleAddHighlight}
                  onVisible={() => setCurrentPage(i + 1)}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Controls */}
      <footer 
        className={`
          fixed bottom-0 left-0 right-0 z-50
          ${currentTheme.controls} ${currentTheme.border} border-t
          backdrop-blur-sm
          transition-transform duration-300
          ${showControls ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full bg-amber-600 progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between px-1 py-2">
          {/* Zoom Out */}
          <button 
            onClick={zoomOut}
            disabled={zoom <= 0.5}
            className={`p-1.5 rounded-full hover:bg-black/10 disabled:opacity-30 ${currentTheme.text}`}
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          {/* Reset Position */}
          <button 
            onClick={resetPan}
            disabled={scrollPosition.x === 0 && scrollPosition.y === 0}
            className={`p-1.5 rounded-full hover:bg-black/10 disabled:opacity-30 ${currentTheme.text}`}
            aria-label="Reset position"
            title="Reset position"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Previous */}
          <button 
            onClick={prevPage}
            disabled={currentPage <= 1}
            className={`p-1.5 rounded-full hover:bg-black/10 disabled:opacity-30 ${currentTheme.text}`}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          {/* Page Info */}
          <div className={`flex flex-col items-center ${currentTheme.text}`}>
            <span className="text-sm font-medium">
              {currentPage} / {totalPages}
            </span>
            <span className="text-xs opacity-60">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          
          {/* Next */}
          <button 
            onClick={nextPage}
            disabled={currentPage >= totalPages}
            className={`p-1.5 rounded-full hover:bg-black/10 disabled:opacity-30 ${currentTheme.text}`}
            aria-label="Next page"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Highlighter */}
          <button 
            onClick={() => setShowHighlightToolbar(prev => !prev)}
            className={`p-1.5 rounded-full hover:bg-black/10 ${currentTheme.text} ${
              showHighlightToolbar ? 'bg-amber-200' : ''
            }`}
            aria-label="Highlighter"
            title="Highlighter"
          >
            <Highlighter className="w-4 h-4" />
          </button>

          {/* Zoom In */}
          <button 
            onClick={zoomIn}
            disabled={zoom >= 3}
            className={`p-1.5 rounded-full hover:bg-black/10 disabled:opacity-30 ${currentTheme.text}`}
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>
      </footer>

      {/* Side tap zones for page navigation (mobile) - only when not zoomed */}
      {viewMode === 'page' && zoom <= 1 && (
        <>
          <div 
            className="fixed left-0 top-14 bottom-16 w-1/5 z-10 md:hidden"
            onClick={(e) => { e.stopPropagation(); prevPage(); }}
          />
          <div 
            className="fixed right-0 top-14 bottom-16 w-1/5 z-10 md:hidden"
            onClick={(e) => { e.stopPropagation(); nextPage(); }}
          />
        </>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <ReaderSettings
          theme={theme}
          setTheme={setTheme}
          viewMode={viewMode}
          setViewMode={setViewMode}
          zoom={zoom}
          setZoom={setZoom}
          fitMode={fitMode}
          setFitMode={setFitMode}
          onClose={() => setShowSettings(false)}
          currentPage={currentPage}
          totalPages={totalPages}
          goToPage={goToPage}
        />
      )}
    </div>
  )
}

export default Reader
