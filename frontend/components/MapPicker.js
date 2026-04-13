'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const DEFAULT_CENTER = [20.5937, 78.9629] // India center

function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng)
      map.flyTo(e.latlng, map.getZoom())
    },
  })

  useEffect(() => {
    if (position) {
      map.flyTo(position, 13) // zoom in nicely when pos changes externally
    }
  }, [position, map])

  return position === null ? null : (
    <Marker position={position} />
  )
}

export default function MapPicker({ value, onChange, className = '' }) {
  const [position, setPosition] = useState(value || null)
  const [loadingLoc, setLoadingLoc] = useState(false)

  // Initialize from value if it changes
  useEffect(() => {
    if (value && (!position || value.lat !== position.lat || value.lng !== position.lng)) {
      setPosition(value)
    }
  }, [value])

  const handleSetPosition = (pos) => {
    setPosition(pos)
    if (onChange) {
      onChange({ lat: pos.lat, lng: pos.lng })
    }
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }
    setLoadingLoc(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleSetPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        setLoadingLoc(false)
      },
      () => {
        alert('Unable to retrieve your location')
        setLoadingLoc(false)
      }
    )
  }

  return (
    <div className={`relative flex flex-col gap-2 ${className}`}>
      <div className="flex justify-between items-center bg-muted/50 p-2 rounded-t-lg border-b border-border">
        <span className="text-xs text-muted-foreground font-medium px-2">Click on map to mark your workshop location</span>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={loadingLoc}
          className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded hover:bg-primary/20 transition-colors font-medium"
        >
          {loadingLoc ? 'Locating...' : 'Use My Current Location'}
        </button>
      </div>
      <div className="h-[300px] w-full bg-muted rounded-b-lg overflow-hidden border border-border shadow-sm">
        <MapContainer
          center={position || DEFAULT_CENTER}
          zoom={position ? 13 : 5}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={handleSetPosition} />
        </MapContainer>
      </div>
    </div>
  )
}
