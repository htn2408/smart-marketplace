import { useState, useEffect, useRef } from 'react'
import Icon from '../common/Icon'
import Button from '../common/Button'
import MapPicker from './MapPicker'
import { geocodeAddress, reverseGeocode } from '../../services/mapService'

/**
 * Interactive Map Modal for Precise Address Selection
 */
export default function GoogleMapModal({
  isOpen,
  initialQuery = '',
  initialCoords = { lat: 21.0285, lng: 105.8542 },
  onClose,
  onConfirm,
}) {
  if (!isOpen) return null

  return (
    <GoogleMapModalContent
      key={`${initialQuery}-${initialCoords?.lat}-${initialCoords?.lng}`}
      initialQuery={initialQuery}
      initialCoords={initialCoords}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}

function GoogleMapModalContent({
  initialQuery,
  initialCoords = { lat: 21.0285, lng: 105.8542 },
  onClose,
  onConfirm,
}) {
  const [searchQuery, setSearchQuery] = useState(
    initialQuery || 'Hà Nội, Việt Nam'
  )
  const [modalCoords, setModalCoords] = useState(initialCoords)
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedAddressLabel, setSelectedAddressLabel] = useState(initialQuery || '')
  const searchContainerRef = useRef(null)

  // Autocomplete search as user types
  useEffect(() => {
    const trimmed = searchQuery.trim()
    if (trimmed.length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await geocodeAddress(trimmed, {
          biasCoords: modalCoords,
          signal: controller.signal,
          limit: 6,
        })
        setSuggestions(results)
        setShowDropdown(results.length > 0)
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Modal geocode error:', err)
        }
      } finally {
        setIsSearching(false)
      }
    }, 350)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [searchQuery, modalCoords.lat, modalCoords.lng])

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle selecting a suggested address item
  const handleSelectSuggestion = (item) => {
    const fullText = item.displayName || item.title
    setSearchQuery(fullText)
    setSelectedAddressLabel(fullText)
    setModalCoords({ lat: item.lat, lng: item.lng })
    setShowDropdown(false)
  }

  // Handle manual Enter or Search button click
  const handleManualSearch = async (e) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const results = await geocodeAddress(searchQuery.trim(), {
        biasCoords: modalCoords,
        limit: 1,
      })
      if (results.length > 0) {
        handleSelectSuggestion(results[0])
      }
    } finally {
      setIsSearching(false)
    }
  }

  // Handle map pin drag or click
  const handleLocationPicked = (loc) => {
    if (loc.lat && loc.lng) {
      setModalCoords({ lat: loc.lat, lng: loc.lng })
    }
  }

  // Handle reverse geocoding resolved from MapPicker
  const handleAddressResolved = (resolved) => {
    if (resolved && resolved.displayName) {
      setSelectedAddressLabel(resolved.displayName)
      setSearchQuery(resolved.displayName)
    }
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(selectedAddressLabel || searchQuery, modalCoords)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest w-full max-w-3xl rounded-2xl shadow-2xl border border-surface-variant/40 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-surface-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon name="map" size={20} />
            </div>
            <div>
              <h3 className="font-headline-sm text-base sm:text-lg font-bold text-on-surface">
                Định vị vị trí chi tiết trên bản đồ
              </h3>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Tìm kiếm số nhà, tên toà nhà hoặc kéo thả ghim đỏ đến vị trí chính xác
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-outline hover:text-on-surface rounded-full hover:bg-surface-container transition-colors cursor-pointer"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Search Bar on Modal with Autocomplete Dropdown */}
        <div
          ref={searchContainerRef}
          className="p-3 sm:p-4 bg-surface-container-low border-b border-surface-variant/30 relative z-20"
        >
          <form onSubmit={handleManualSearch} className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <Icon
                name="search"
                size={20}
                className="absolute left-3.5 text-primary pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true)
                }}
                placeholder="Nhập số nhà, tên đường, toà nhà, khu chung cư..."
                className="w-full pl-10 pr-20 py-2.5 bg-surface-container-lowest rounded-xl font-label-md text-sm text-on-surface outline-none border border-surface-variant/40 focus:border-primary transition-all shadow-sm"
              />
              <div className="absolute right-3 flex items-center gap-1.5">
                {isSearching && (
                  <Icon
                    name="sync"
                    size={16}
                    className="animate-spin text-primary"
                  />
                )}
                {searchQuery && !isSearching && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setSuggestions([])
                      setShowDropdown(false)
                    }}
                    className="text-outline hover:text-on-surface p-1 transition-colors cursor-pointer"
                  >
                    <Icon name="close" size={16} />
                  </button>
                )}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="px-4 py-2.5 rounded-xl font-bold shrink-0"
              disabled={isSearching || !searchQuery.trim()}
            >
              Tìm
            </Button>
          </form>

          {/* Autocomplete Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute left-3 right-3 sm:left-4 sm:right-4 top-full mt-1.5 bg-surface-container-lowest rounded-xl shadow-2xl border border-surface-variant/40 overflow-hidden divide-y divide-surface-variant/20 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 z-30">
              <div className="px-3 py-1.5 bg-surface-container-low text-[10px] font-bold text-primary uppercase tracking-wider">
                Địa điểm phù hợp (Click để đưa bản đồ tới vị trí)
              </div>
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectSuggestion(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSelectSuggestion(item)
                    }
                  }}
                  className="p-3 hover:bg-primary-fixed/20 flex items-start gap-3 transition-colors cursor-pointer text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="location_on" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-on-surface truncate">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="text-xs text-on-surface-variant truncate">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interactive Leaflet Map Canvas with Google Tiles */}
        <div className="relative flex-1 min-h-[360px] sm:min-h-[420px] w-full bg-surface-container">
          <MapPicker
            lat={modalCoords.lat}
            lng={modalCoords.lng}
            onLocationSelect={handleLocationPicked}
            onAddressResolved={handleAddressResolved}
            className="w-full h-full min-h-[360px] sm:min-h-[420px] rounded-none border-none shadow-none"
          />
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-surface-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container-lowest">
          <div className="text-xs text-on-surface-variant truncate w-full sm:w-auto flex-1">
            <span className="font-semibold text-on-surface">Vị trí đã chọn: </span>
            <span className="text-primary font-medium">
              {selectedAddressLabel || searchQuery || 'Chưa xác định'}
            </span>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="px-4"
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon="check"
              onClick={handleConfirm}
              className="px-5 font-bold"
            >
              Xác nhận vị trí này
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
