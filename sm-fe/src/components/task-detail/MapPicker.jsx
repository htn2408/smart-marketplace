import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Icon from '../common/Icon'
import { reverseGeocode } from '../../services/mapService'

/**
 * Interactive Map Picker with Leaflet & Google Map Tiles
 * Supports draggable pin, click to pin, GPS location, and reverse geocoding on pin drop
 */
export default function MapPicker({
  lat = 21.0285,
  lng = 105.8542,
  radius = 3000,
  onLocationSelect,
  onAddressResolved,
  className = '',
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const circleRef = useRef(null)

  const lastCoordsRef = useRef({ lat, lng })
  const [isLocating, setIsLocating] = useState(false)
  const [addressHint, setAddressHint] = useState('')
  const reverseTimeoutRef = useRef(null)

  // Create custom pulsing pin icon with prominent red location pin
  const createCustomPinIcon = () => {
    return L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: grab;">
          <div style="position: absolute; inset: 2px; border-radius: 9999px; background: rgba(239, 68, 68, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 34px; height: 34px; border-radius: 9999px; background: #dc2626; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.5); border: 2.5px solid white;">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    })
  }

  // Handle position update & trigger reverse geocoding
  const handleUpdatePosition = useCallback(
    (newLat, newLng) => {
      lastCoordsRef.current = { lat: newLat, lng: newLng }

      if (markerRef.current) {
        markerRef.current.setLatLng([newLat, newLng])
      }
      if (circleRef.current) {
        circleRef.current.setLatLng([newLat, newLng])
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo([newLat, newLng], { animate: true })
      }

      setAddressHint(`Toạ độ: ${newLat.toFixed(5)}, ${newLng.toFixed(5)}`)
      if (onLocationSelect) {
        onLocationSelect({ lat: newLat, lng: newLng })
      }

      // Debounce reverse geocoding to retrieve readable street / place name
      if (reverseTimeoutRef.current) clearTimeout(reverseTimeoutRef.current)
      reverseTimeoutRef.current = setTimeout(async () => {
        try {
          const rev = await reverseGeocode(newLat, newLng)
          if (rev && rev.displayName) {
            setAddressHint(rev.displayName)
            if (onAddressResolved) {
              onAddressResolved(rev)
            }
          }
        } catch {
          // Keep coordinates hint
        }
      }, 400)
    },
    [onLocationSelect, onAddressResolved]
  )

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 16,
      zoomControl: false,
    })

    // Google Maps Tile layer
    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps',
    }).addTo(map)

    // Add 3km service radius circle
    const circle = L.circle([lat, lng], {
      radius: radius,
      color: '#dc2626',
      weight: 1.5,
      fillColor: '#dc2626',
      fillOpacity: 0.06,
      dashArray: '4, 6',
    }).addTo(map)
    circleRef.current = circle

    // Add draggable marker
    const marker = L.marker([lat, lng], {
      icon: createCustomPinIcon(),
      draggable: true,
    }).addTo(map)

    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      handleUpdatePosition(pos.lat, pos.lng)
    })
    markerRef.current = marker

    // Click map to move marker
    map.on('click', (e) => {
      handleUpdatePosition(e.latlng.lat, e.latlng.lng)
    })

    // Add zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    mapInstanceRef.current = map

    // Fix possible container rendering glitches
    setTimeout(() => {
      map.invalidateSize()
    }, 200)

    return () => {
      if (reverseTimeoutRef.current) clearTimeout(reverseTimeoutRef.current)
      map.remove()
      mapInstanceRef.current = null
    }
  }, [lat, lng, radius, handleUpdatePosition])

  // Sync external lat/lng changes to map
  useEffect(() => {
    if (
      lat &&
      lng &&
      (lat !== lastCoordsRef.current.lat || lng !== lastCoordsRef.current.lng)
    ) {
      lastCoordsRef.current = { lat, lng }
      if (markerRef.current) markerRef.current.setLatLng([lat, lng])
      if (circleRef.current) circleRef.current.setLatLng([lat, lng])
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([lat, lng], 16, { animate: true })
      }
    }
  }, [lat, lng])

  // GPS Current Location
  const handleGetGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        const userLat = pos.coords.latitude
        const userLng = pos.coords.longitude
        handleUpdatePosition(userLat, userLng, true)
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([userLat, userLng], 16)
        }
      },
      (err) => {
        setIsLocating(false)
        console.warn('GPS error:', err.message)
        alert('Không thể lấy vị trí GPS. Vui lòng cho phép quyền truy cập vị trí trên trình duyệt.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden shadow-md border border-surface-variant/40 ${className}`}>
      {/* Map canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[260px] z-0" />

      {/* Floating control buttons */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={handleGetGPSLocation}
          disabled={isLocating}
          className="bg-surface-container-lowest/95 hover:bg-surface-container text-primary font-label-sm text-xs font-bold px-3 py-2 rounded-xl shadow-md border border-surface-variant/40 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer backdrop-blur-md"
          title="Lấy vị trí GPS hiện tại của tôi"
        >
          <Icon
            name={isLocating ? 'sync' : 'my_location'}
            size={16}
            className={isLocating ? 'animate-spin' : ''}
          />
          <span>{isLocating ? 'Đang định vị...' : 'Vị trí của tôi'}</span>
        </button>
      </div>

      {/* Bottom info floating badge */}
      <div className="absolute bottom-3 left-3 right-14 z-10 pointer-events-none">
        <div className="bg-surface-container-lowest/95 backdrop-blur-md p-2.5 rounded-xl shadow-lg border border-surface-variant/40 flex items-center gap-3 max-w-md pointer-events-auto">
          <span className="w-3 h-3 rounded-full bg-primary animate-ping flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-label-sm text-xs font-bold text-on-surface truncate">
              Vị trí ghim trên bản đồ
            </p>
            <p className="font-caption text-[11px] text-on-surface-variant truncate">
              {addressHint || 'Click hoặc kéo thả ghim đỏ để định vị chính xác'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
