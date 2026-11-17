import { getVehiclePhotos } from '../../lib/media'
import { VehicleCard } from './VehicleCard'

export function VehicleGrid({ vehicles, photosById = {}, onOpen }) {
  return (
    <div className="vehicle-grid">
      {vehicles.map((vehicle, index) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          index={index}
          photos={getVehiclePhotos(vehicle, photosById)}
          onOpen={onOpen}
        />
      ))}
    </div>
  )
}
