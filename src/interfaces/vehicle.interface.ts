export interface IVehicle {
  id: string;
  shop_id?: string;
  customer_id?: string;
  type: VehicleType;
  brand: string;
  model: string;
  variant?: string;
  year: number;
  registration_number: string;
  chassis_number: string;
  engine_number: string;
  color: string;
  mileage: number;
  fuel_type: FuelType;
  transmission: TransmissionType;
  engine_capacity?: number;
  ownership: OwnershipType;
  insurance_valid_till: Date;
  buying_price?: number;
  selling_price?: number;
  vehicle_image_urls?: string[];
  vehicle_doc_urls?: string[];
  status: BikeStatus;
  buying_date: Date;
  selling_date?: Date;
  features: string[];
  description?: string;
}

export enum VehicleType {
  BIKE = 'BIKE',
  SCOTY = 'SCOTY',
  CAR = 'CAR',
}

export enum FuelType {
  PETROL = 'PETROL',
  DIESEL = 'DIESEL',
  CNG = 'CNG',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
}

export enum TransmissionType {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
  SEMI_AUTOMATIC = 'SEMI_AUTOMATIC',
}

export enum BikeStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  MAINTENANCE = 'MAINTENANCE',
  RENTED = 'RENTED',
  BOOKED = 'BOOKED',
  ON_HOLD = 'ON_HOLD',
}

export enum OwnershipType {
  FIRST = 'FIRST',
  SECOND = 'SECOND',
  THIRD = 'THIRD',
  FOURTH_PLUS = 'FOURTH_PLUS',
}
