import { VehicleCard } from './VehicleCard'

export function VehicleGrid({ vehicles }) {
  return (
    <div className="vehicle-grid">
      {vehicles.map((vehicle, index) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} index={index} />
      ))}
    </div>
  )
}
