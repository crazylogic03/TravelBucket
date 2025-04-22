import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useAppContext } from '../context/AppContext'
import DestinationDetail from './DestinationDetail'

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom marker icons
const visitedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const bucketListIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Component to recenter map when selected destination changes
function ChangeMapView({ center }) {
  const map = useMap()

  useEffect(() => {
    if (center) {
      map.flyTo(center, 10, {
        animate: true,
        duration: 1.5
      })
    }
  }, [center, map])

  return null
}

function MapView({ selectedDestination, onSelect }) {
  const { destinations } = useAppContext()
  const [mapCenter, setMapCenter] = useState([20, 0])
  const [zoom, setZoom] = useState(2)
  const [sidebarDestination, setSidebarDestination] = useState(null)

  // Update map center when selected destination changes
  useEffect(() => {
    if (selectedDestination && selectedDestination.lat && selectedDestination.lng) {
      setMapCenter([selectedDestination.lat, selectedDestination.lng])
      setZoom(10)
      setSidebarDestination(selectedDestination)
    }
  }, [selectedDestination])

  // Filter destinations with coordinates
  const validDestinations = destinations.filter(
    dest => dest.lat && dest.lng && !isNaN(dest.lat) && !isNaN(dest.lng)
  )

  const handleMarkerClick = (destination) => {
    setSidebarDestination(destination)
    if (onSelect) {
      onSelect(destination)
    }
  }

  const closeSidebar = () => {
    setSidebarDestination(null)
    if (onSelect) {
      onSelect(null)
    }
  }

  return (
    <div className="h-full flex flex-col md:flex-row">
      <div className="h-[60vh] md:h-full md:flex-grow">
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {validDestinations.map(dest => (
            <Marker
              key={dest.id}
              position={[dest.lat, dest.lng]}
              icon={dest.visited ? visitedIcon : bucketListIcon}
              eventHandlers={{
                click: () => handleMarkerClick(dest),
              }}
            >
              <Popup>
                <div className="text-center">
                  <strong>{dest.city}</strong>
                  <div>{dest.country}</div>
                  {dest.visited && (
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-1">
                      Visited
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          <ChangeMapView center={mapCenter} />
        </MapContainer>
      </div>

      {sidebarDestination && (
        <div className="md:w-1/3 lg:w-1/4 bg-white shadow-lg md:shadow-none md:border-l border-neutral-200 overflow-auto">
          <DestinationDetail
            destination={sidebarDestination}
            onClose={closeSidebar}
          />
        </div>
      )}
    </div>
  )
}

export default MapView