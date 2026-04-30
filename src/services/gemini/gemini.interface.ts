import { VehicleCategory, VehicleType, FuelType, TransmissionType, OwnershipType, InsuranceType } from '@prisma/client';

// ──────────────────────────────────────────────
// The shape Gemini fills back to us
// ──────────────────────────────────────────────
export interface RCExtractedData {
  // Identity
  vehicle_category: VehicleCategory | null;
  vehicle_type: VehicleType | null;
  brand: string | null;
  model: string | null;
  variant: string | null;
  manufacture_year: number | null;
  registration_year: number | null;
  color: string | null;

  // Registration & Compliance
  registration_number: string | null;
  chassis_number: string | null;
  engine_number: string | null;
  registration_valid_till: string | null; // ISO date string
  insurance_valid_till: string | null;
  insurance_type: InsuranceType | null;
  puc_valid_till: string | null;
  is_hypothecation: boolean;
  hypothecation_bank: string | null;
  rc_available: boolean;

  // Ownership
  ownership: OwnershipType | null;
  ownership_city: string | null;
  ownership_state: string | null;

  // Fuel & Drivetrain
  fuel_type: FuelType | null;
  transmission: TransmissionType | null;

  // Extras extracted from RC
  owner_name: string | null; // Not in Vehicle model but useful for Customer lookup
  rto_code: string | null; // Derived from registration number prefix
}

// ──────────────────────────────────────────────
// Prompt sent to Gemini Vision
// ──────────────────────────────────────────────
export const RC_EXTRACTION_PROMPT = `
You are an expert at reading Indian vehicle Registration Certificates (RC books / RC smart cards).
Carefully read the RC document in the image and extract ALL the information you can find.

Return ONLY a valid JSON object with these exact keys (use null if a field is not visible or not applicable):

{
  "vehicle_category": one of ["TWO_WHEELER","FOUR_WHEELER","THREE_WHEELER","COMMERCIAL"] — infer from vehicle type,
  "vehicle_type": one of ["BIKE","SCOOTER","CAR","AUTO_RICKSHAW","TRUCK","OTHER"],
  "brand": manufacturer name (e.g. "Honda", "Maruti Suzuki", "Tata"),
  "model": vehicle model name (e.g. "Activa 6G", "Swift Dzire", "Nexon"),
  "variant": trim/variant (e.g. "VX", "ZXi+", "LXi") — null if not shown,
  "manufacture_year": 4-digit integer year of manufacture,
  "registration_year": 4-digit integer year of first registration,
  "color": vehicle color as written on RC,
  "registration_number": full registration number with spaces removed (e.g. "MH31AB1234"),
  "chassis_number": chassis/VIN number,
  "engine_number": engine number,
  "registration_valid_till": expiry date in YYYY-MM-DD format (null if not shown),
  "insurance_valid_till": insurance expiry date in YYYY-MM-DD format (null if not shown),
  "insurance_type": one of ["COMPREHENSIVE","THIRD_PARTY","EXPIRED"] — null if not shown,
  "puc_valid_till": PUC expiry date in YYYY-MM-DD format (null if not shown),
  "is_hypothecation": true if a bank/financier name is shown under hypothecation, else false,
  "hypothecation_bank": name of the hypothecation bank (null if none),
  "rc_available": true (since we have the RC image),
  "ownership": one of ["FIRST","SECOND","THIRD","FOURTH_OR_MORE"] — from "No. of previous owners" or owner count,
  "ownership_city": city from the RTO address on RC,
  "ownership_state": state from the RTO address on RC,
  "fuel_type": one of ["PETROL","DIESEL","ELECTRIC","CNG","LPG","HYBRID"],
  "transmission": one of ["MANUAL","AUTOMATIC","CVT"] — null if not on RC,
  "owner_name": registered owner's full name,
  "rto_code": first 4-5 characters of registration number (e.g. "MH31")
}

Return ONLY the JSON. No explanation, no markdown, no code fences.
`;
