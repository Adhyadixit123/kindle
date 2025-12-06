import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

const PageRenderer = forwardRef(({ 
  pdf, 
  pageNumber, 
  zoom, 
  theme, 
  onVisible, 
  fitMode = 'width',
  panOffset,
  highlights = [],
  highlightColor,
  onAddHighlight
}, ref) => {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const textLayerRef = useRef(null)
  const highlightLayerRef = useRef(null)
  const [isRendering, setIsRendering] = useState(false)
  const [scale, setScale] = useState(1)
  const [viewport, setViewport] = useState(null)
  const renderTaskRef = useRef(null)

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getScale: () => scale,
    getViewport: () => viewport
  }))

  // Intersection observer for scroll mode
  useEffect(() => {
    if (!onVisible || !containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            onVisible()
          }
        })
      },
      { threshold: 0.3 }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [onVisible])

  // Render page - FULL WIDTH/HEIGHT
  useEffect(() => {
    if (!pdf || !containerRef.current) return

    const renderPage = async () => {
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel() } catch (e) {}
      }

      setIsRendering(true)

      try {
        const page = await pdf.getPage(pageNumber)
        
        // Get available space from scroll container or window
        const scrollContainer = document.getElementById('page-scroll-container')
        const availableWidth = scrollContainer?.clientWidth || window.innerWidth
        const availableHeight = scrollContainer?.clientHeight || window.innerHeight

        const originalViewport = page.getViewport({ scale: 1 })
        
        // Calculate scale to FIT WIDTH (like Kindle) or FIT HEIGHT
        let baseScale
        if (fitMode === 'width') {
          baseScale = availableWidth / originalViewport.width
        } else if (fitMode === 'height') {
          baseScale = availableHeight / originalViewport.height
        } else {
          // Fit to container
          const scaleX = availableWidth / originalViewport.width
          const scaleY = availableHeight / originalViewport.height
          baseScale = Math.min(scaleX, scaleY)
        }
        
        baseScale = baseScale * zoom
        setScale(baseScale)

        const viewport = page.getViewport({ scale: baseScale })
        setViewport(viewport)

        // High DPI for crisp rendering
        const dpr = window.devicePixelRatio || 1
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        canvas.width = Math.floor(viewport.width * dpr)
        canvas.height = Math.floor(viewport.height * dpr)
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`

        context.scale(dpr, dpr)

        // Clear and set background
        const bgColor = theme === 'dark' ? '#121212' : theme === 'sepia' ? '#f8f4e8' : '#ffffff'
        context.fillStyle = bgColor
        context.fillRect(0, 0, viewport.width, viewport.height)

        // Render PDF page
        renderTaskRef.current = page.render({
          canvasContext: context,
          viewport: viewport
        })
        
        await renderTaskRef.current.promise

        // Render text layer for selection
        if (textLayerRef.current) {
          textLayerRef.current.innerHTML = ''
          textLayerRef.current.style.width = `${viewport.width}px`
          textLayerRef.current.style.height = `${viewport.height}px`
          // Set the required CSS variable for PDF.js text layer
          textLayerRef.current.style.setProperty('--scale-factor', baseScale.toString())

          const textContent = await page.getTextContent()
          
          pdfjsLib.renderTextLayer({
            textContentSource: textContent,
            container: textLayerRef.current,
            viewport: viewport,
            textDivs: []
          })
        }

        // Apply dark mode inversion
        if (theme === 'dark') {
          context.globalCompositeOperation = 'difference'
          context.fillStyle = '#ffffff'
          context.fillRect(0, 0, viewport.width, viewport.height)
          context.globalCompositeOperation = 'source-over'
        }

      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', err)
        }
      } finally {
        setIsRendering(false)
      }
    }

    renderPage()

    return () => {
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel() } catch (e) {}
      }
    }
  }, [pdf, pageNumber, zoom, theme, fitMode])

  // Re-render on resize
  useEffect(() => {
    const handleResize = () => {
      // Force re-render by triggering effect
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle text selection for highlighting
  const handleMouseUp = useCallback(() => {
    if (!highlightColor || !onAddHighlight) return
    
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const text = selection.toString()
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const containerRect = containerRef.current?.getBoundingClientRect()
      
      if (containerRect) {
        const highlight = {
          id: Date.now(),
          pageNumber,
          text,
          color: highlightColor,
          rect: {
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height
          }
        }
        onAddHighlight(highlight)
      }
    }
  }, [highlightColor, onAddHighlight, pageNumber])

  // Render highlights
  const renderHighlights = () => {
    const pageHighlights = highlights.filter(h => h.pageNumber === pageNumber)
    return pageHighlights.map(h => (
      <div
        key={h.id}
        className="absolute pointer-events-none"
        style={{
          left: h.rect.x,
          top: h.rect.y,
          width: h.rect.width,
          height: h.rect.height,
          backgroundColor: h.color,
          opacity: 0.4,
          borderRadius: '2px'
        }}
      />
    ))
  }

  return (
    <div 
      ref={containerRef}
      className="page-container relative"
      style={{ width: 'fit-content', height: 'fit-content' }}
      onMouseUp={handleMouseUp}
    >
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/10">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className="relative" style={{ opacity: isRendering ? 0.5 : 1 }}>
        <canvas ref={canvasRef} className="block" />
        {/* Highlight layer */}
        <div ref={highlightLayerRef} className="absolute top-0 left-0 pointer-events-none">
          {renderHighlights()}
        </div>
        {/* Text layer for selection */}
        <div 
          ref={textLayerRef} 
          className="text-layer absolute top-0 left-0 overflow-hidden"
          style={{ pointerEvents: highlightColor ? 'auto' : 'none' }}
        />
      </div>
    </div>
  )
})

PageRenderer.displayName = 'PageRenderer'

export default PageRenderer
