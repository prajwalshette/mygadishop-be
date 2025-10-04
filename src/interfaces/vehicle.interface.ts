
export enum VehicleType {
  BIKE = "BIKE",
  SCOTY = "SCOTY",
}

export enum FuelType {
  PETROL = "PETROL",
  DIESEL = "DIESEL",
  CNG = "CNG",
  ELECTRIC = "ELECTRIC",
  HYBRID = "HYBRID",
}

export enum TransmissionType {
  MANUAL = "MANUAL",
  AUTOMATIC = "AUTOMATIC",
}

export enum BikeStatus {
  AVAILABLE = "AVAILABLE",
  SOLD = "SOLD",
  MAINTENANCE = "MAINTENANCE",
  RENTED = "RENTED",
  RESERVED = "RESERVED",
}


export interface IVehicle {
  id: string;
  customer_id?: string;
  type: VehicleType;
  brand: string;
  model: string;
  year: number;
  registration_number: string;
  chassis_number: string;
  engine_number: string;
  color: string;
  mileage: number;
  fuel_type: FuelType;
  transmission: TransmissionType;
  price: number;
  buying_price?: number;
  selling_price?: number;
  vehicle_image_urls?: string[];
  vehicle_doc_urls?: string[];
  status: BikeStatus;
  buying_date: Date;
  selling_date?: Date;
}
