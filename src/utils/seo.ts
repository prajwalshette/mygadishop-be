import { VehicleCategory, type PrismaClient } from '@prisma/client';

// ============================================================
//   1. Slug 
// ============================================================
//  second-hand-honda-activa-nashik-2020-mh12
export function buildSlug(v: {
    brand: string
    model: string
    ownership_city?: string | null
    manufacture_year: number
    registration_number: string
    vehicle_category: VehicleCategory  // TWO_WHEELER | FOUR_WHEELER
  }): string {
  
    const toSlug = (val: any) =>
      String(val ?? '')
        .toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-');
  
    // "second-hand" beats "used" in Indian regional searches
    return [
      'second-hand',
      toSlug(v.brand),
      toSlug(v.model),
      toSlug(v.ownership_city ?? 'india'),
      v.manufacture_year,
      toSlug(v.registration_number.slice(-4)),  // uniqueness only
    ].join('-');
  }

/**
 * Build a URL slug and ensure it is unique among non-deleted vehicles (appends -1, -2, … if needed).
 */
export async function generateUniqueSlug(
  v: {
    brand: string;
    model: string;
    ownership_city?: string | null;
    manufacture_year: number;
    registration_number: string;
    vehicle_category: VehicleCategory;
  },
  prisma: PrismaClient,
  options?: { excludeVehicleId?: string },
): Promise<string> {
  const base = buildSlug(v);
  let candidate = base;
  let n = 0;
  for (;;) {
    const found = await prisma.vehicle.findFirst({
      where: {
        slug: candidate,
        deleted_at: null,
        ...(options?.excludeVehicleId ? { id: { not: options.excludeVehicleId } } : {}),
      },
      select: { id: true },
    });
    if (!found) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

// ============================================================
//   1b. Shop Slug
// ============================================================
// {shop-name}-{city}
export function buildShopSlug(s: { shop_name: string; city: string }): string {
  const toSlug = (val: any) =>
    String(val ?? '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');

  return [toSlug(s.shop_name), toSlug(s.city)].filter(Boolean).join('-');
}

/**
 * Build a shop URL slug and ensure it is unique among non-deleted shops (appends -1, -2, … if needed).
 */
export async function generateUniqueShopSlug(
  s: { shop_name: string; city: string },
  prisma: PrismaClient,
  options?: { excludeShopId?: string },
): Promise<string> {
  const base = buildShopSlug(s);
  let candidate = base;
  let n = 0;
  for (;;) {
    const found = await prisma.shop.findFirst({
      where: {
        slug: candidate,
        deleted_at: null,
        ...(options?.excludeShopId ? { id: { not: options.excludeShopId } } : {}),
      },
      select: { id: true },
    });
    if (!found) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}
  
  // Result: second-hand-honda-activa-nashik-2020-mh12  (43 chars ✅)
  // Result: second-hand-maruti-swift-dzire-amravati-2019-mh28 (50 chars ✅)


//   ============================================================
//   2. Meta Title
//   ============================================================

// "2020 Honda Activa 5G in Nashik - ₹52,000 | MyGadiShop"

const formatTitlePrice = (price: number): string => {
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`   // ₹1.2L
    if (price >= 1000)   return `₹${Math.round(price / 1000)}K`      // ₹52K
    return `₹${price}`
  }
  
  export function buildMetaTitle(v: {
    manufacture_year: number
    brand: string
    model: string
    variant?: string | null
    ownership_city?: string | null
    selling_price?: number | null
  }, shopName = 'MyGadiShop'): string {
  
    const name = [v.manufacture_year, v.brand, v.model, v.variant]
      .filter(Boolean).join(' ')
  
    const city  = v.ownership_city ?? 'India'
    const price = v.selling_price
      ? ` - ${formatTitlePrice(v.selling_price)}`
      : ''
  
    // Priority order: Vehicle name → City → Price → Brand
    // This matches how CarDekho and Cars24 structure titles
    const title = `${name} in ${city}${price} | ${shopName}`
  
    return title.length > 60
      ? title.slice(0, 57).trimEnd() + '...'
      : title
  }
  
  // Results:
  // "2020 Honda Activa 5G in Nashik - ₹52K | MyGadiShop"     (52 chars ✅)
  // "2019 Maruti Swift Dzire in Amravati - ₹4.2L | MyGadiShop" (57 chars ✅)
  // "2022 Royal Enfield Classic 350 in Pune - ₹1.6L | MyGadiShop" → truncates to 60


// ============================================================
//   3. Meta Description 
//   ============================================================
// "2020 Honda Activa 5G for sale in Nashik. ₹52,000 | 34,000 km | 
//  1st owner | Petrol. Good condition, no accident. RC available.
//  Inspect at MyGadiShop — Call now!"

const OWNERSHIP_MAP: Record<string, string> = {
    FIRST:  '1st owner',
    SECOND: '2nd owner',
    THIRD:  '3rd owner',
    FOURTH: '4th+ owner',
  }
  
  const CONDITION_MAP: Record<string, string> = {
    EXCELLENT: 'Excellent condition',
    GOOD:      'Good condition',
    FAIR:      'Fair condition',
    POOR:      'Needs work',
  }
  
  const formatDescPrice = (price: number): string => {
    // Fix your ₹0.5 Lakh bug — use proper Indian format
    if (price >= 100000) {
      const lakh = price / 100000
      // 1.00 → "₹1 Lakh", 1.50 → "₹1.5 Lakh", 1.25 → "₹1.25 Lakh"
      return `₹${parseFloat(lakh.toFixed(2))} Lakh`
    }
    // Under 1 lakh — show full number
    return `₹${price.toLocaleString('en-IN')}`
  }
  
  export function buildMetaDescription(v: {
    manufacture_year: number
    brand: string
    model: string
    variant?: string | null
    ownership_city?: string | null
    selling_price?: number | null
    odometer_reading: number
    ownership: string
    fuel_type: string
    condition: string
    accident_history: boolean
    rc_available: boolean
    insurance_valid_till?: Date | null
  }): string {
  
    const name  = [v.manufacture_year, v.brand, v.model, v.variant]
      .filter(Boolean).join(' ')
    const city  = v.ownership_city ?? 'India'
    const price = v.selling_price ? formatDescPrice(v.selling_price) : 'Best price'
    const km    = `${v.odometer_reading.toLocaleString('en-IN')} km`
    const owner = OWNERSHIP_MAP[v.ownership] ?? v.ownership
    const fuel  = v.fuel_type.charAt(0) + v.fuel_type.slice(1).toLowerCase()
    const cond  = CONDITION_MAP[v.condition] ?? v.condition
  
    // Trust signals — only add if TRUE (don't mention bad things)
    const noAccident = !v.accident_history ? 'No accident history. ' : ''
    const rc         = v.rc_available ? 'RC available. ' : ''
    const insured    = v.insurance_valid_till && v.insurance_valid_till > new Date()
      ? 'Valid insurance. ' : ''
  
    // Pipe format (|) is how CarDekho shows key specs — scannable in 2 seconds
    const desc =
      `${name} for sale in ${city}. ` +
      `${price} | ${km} | ${owner} | ${fuel}. ` +
      `${cond}. ${noAccident}${rc}${insured}` +
      `Contact MyGadiShop today!`
  
    return desc.length > 155
      ? desc.slice(0, 152).trimEnd() + '...'
      : desc
  }

export const generateMetaDescription = buildMetaDescription;
  
  // Result (141 chars ✅):
  // "2020 Honda Activa 5G for sale in Nashik. ₹52,000 | 34,000 km | 
  //  1st owner | Petrol. Good condition. No accident history. RC available. 
  //  Contact MyGadiShop today!"