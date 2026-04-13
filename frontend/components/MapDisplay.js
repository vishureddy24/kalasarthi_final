'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Store, User, MapPin } from 'lucide-react'

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const DEFAULT_CENTER = [20.5937, 78.9629] // India center

export default function MapDisplay({ artisans = [], className = '' }) {
  const [activeArtisan, setActiveArtisan] = useState(null)

  return (
    <div className={`h-[500px] w-full rounded-2xl overflow-hidden border border-border shadow-md bg-muted ${className}`}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={4}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {artisans.map(artisan => {
          if (!artisan.lat || !artisan.lng) return null
          return (
            <Marker
              key={artisan.id || artisan._id}
              position={[artisan.lat, artisan.lng]}
              eventHandlers={{
                click: () => setActiveArtisan(artisan),
              }}
            >
              <Popup>
                <div className="flex flex-col gap-2 p-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shrink-0">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground leading-tight m-0 p-0 text-sm">
                        {artisan.displayName || 'Artisan'}
                      </h4>
                      <p className="text-xs text-muted-foreground m-0 p-0">{artisan.craftType || 'Artisan Craft'}</p>
                    </div>
                  </div>
                  {artisan.location && (
                    <div className="flex items-start gap-1 text-xs mt-1 text-muted-foreground">
                      <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>{artisan.location}</span>
                    </div>
                  )}
                  {artisan.bio && (
                    <p className="text-xs text-foreground line-clamp-2 mt-1">{artisan.bio}</p>
                  )}
                  <a
                    href={`/dashboard/marketplace?artisanId=${artisan.id}`}
                    className="mt-2 text-xs text-center bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors py-1.5 px-3 rounded-lg font-medium block no-underline"
                  >
                    View Products
                  </a>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
