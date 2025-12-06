import React, { useState } from 'react'
import { 
  X, 
  Sun, 
  Moon, 
  Sunrise,
  Scroll,
  BookOpen,
  ZoomIn,
  ZoomOut,
  SkipForward,
  MoveHorizontal,
  MoveVertical,
  Maximize
} from 'lucide-react'

function ReaderSettings({ 
  theme, 
  setTheme, 
  viewMode, 
  setViewMode, 
  zoom, 
  setZoom,
  fitMode,
  setFitMode,
  onClose,
  currentPage,
  totalPages,
  goToPage
}) {
  const [jumpPage, setJumpPage] = useState(currentPage.toString())

  const handleJumpPage = (e) => {
    e.preventDefault()
    const page = parseInt(jumpPage, 10)
    if (page >= 1 && page <= totalPages) {
      goToPage(page)
      onClose()
    }
  }

  const themeOptions = [
    { id: 'light', icon: Sun, label: 'Light', bg: 'bg-white', text: 'text-gray-900' },
    { id: 'sepia', icon: Sunrise, label: 'Sepia', bg: 'bg-kindle-cream', text: 'text-kindle-text' },
    { id: 'dark', icon: Moon, label: 'Dark', bg: 'bg-gray-900', text: 'text-white' }
  ]

  const viewOptions = [
    { id: 'page', icon: BookOpen, label: 'Page' },
    { id: 'scroll', icon: Scroll, label: 'Scroll' }
  ]

  const fitOptions = [
    { id: 'width', icon: MoveHorizontal, label: 'Fit Width' },
    { id: 'height', icon: MoveVertical, label: 'Fit Height' },
    { id: 'page', icon: Maximize, label: 'Fit Page' }
  ]

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Settings Panel */}
      <div 
        className="settings-panel relative w-full max-w-md mx-4 mb-4 md:mb-0 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Theme Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id)}
                  className={`
                    flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all
                    ${theme === option.id 
                      ? 'border-amber-600 ring-2 ring-amber-100' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className={`w-10 h-10 rounded-full ${option.bg} border border-gray-300 flex items-center justify-center`}>
                    <option.icon className={`w-5 h-5 ${option.text}`} />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* View Mode */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">View Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {viewOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setViewMode(option.id)}
                  className={`
                    flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all
                    ${viewMode === option.id 
                      ? 'border-amber-600 bg-amber-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <option.icon className="w-5 h-5 text-gray-700" />
                  <span className="text-sm font-medium text-gray-700">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fit Mode */}
          {setFitMode && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Page Fit</label>
              <div className="grid grid-cols-3 gap-2">
                {fitOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setFitMode(option.id)}
                    className={`
                      flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all
                      ${fitMode === option.id 
                        ? 'border-amber-600 bg-amber-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <option.icon className="w-5 h-5 text-gray-700" />
                    <span className="text-xs font-medium text-gray-700">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Zoom Control */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Zoom: {Math.round(zoom * 100)}%
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="w-5 h-5 text-gray-700" />
              </button>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={zoom >= 3}
              >
                <ZoomIn className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Jump to Page */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">Go to Page</label>
            <form onSubmit={handleJumpPage} className="flex gap-2">
              <input
                type="number"
                min="1"
                max={totalPages}
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                placeholder={`1 - ${totalPages}`}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
              >
                <SkipForward className="w-4 h-4" />
                Go
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Tip: Swipe left/right or tap screen edges to navigate pages
          </p>
        </div>
      </div>
    </div>
  )
}

export default ReaderSettings
