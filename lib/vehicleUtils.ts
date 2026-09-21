import { VehicleType } from '@/types/database';

export interface VehicleEntry {
  id: string;
  type: 'car' | 'motorcycle';
  model: string;
  plate: string;
  rate: number;
}

export interface VehicleItem {
  model: string;
  plate: string;
  rate: number;
}

export interface ParsedVehicleInfo {
  type: VehicleType;
  hasCar: boolean;
  hasMotorcycle: boolean;
  car: VehicleItem;
  motorcycle: VehicleItem;
  baseRate: number;
  vehiclesList?: VehicleEntry[];
}

export interface EmbeddedMetadata {
  cleanBio: string;
  embeddedSchedule: string | null;
  embeddedVehicle: {
    hasCar: boolean;
    hasMotorcycle: boolean;
    carModel: string;
    carPlate: string;
    carRate: number;
    motorcycleModel: string;
    motorcyclePlate: string;
    motorcycleRate: number;
  } | null;
  embeddedVehiclesList: VehicleEntry[] | null;
}

export function extractCleanBio(bio?: string | null): EmbeddedMetadata {
  if (!bio) {
    return {
      cleanBio: '',
      embeddedSchedule: null,
      embeddedVehicle: null,
      embeddedVehiclesList: null,
    };
  }

  let clean = bio;
  let embeddedSchedule: string | null = null;
  let embeddedVehicle: EmbeddedMetadata['embeddedVehicle'] = null;
  let embeddedVehiclesList: VehicleEntry[] | null = null;

  // Match [SCHEDULE: ...]
  const schedMatch = clean.match(/\[SCHEDULE:\s*([^\]]+)\]/);
  if (schedMatch) {
    embeddedSchedule = schedMatch[1].trim();
    clean = clean.replace(/\[SCHEDULE:\s*[^\]]+\]/, '').trim();
  }

  // Match [VEHICLES_JSON: [...]]
  const listMatch = clean.match(/\[VEHICLES_JSON:\s*(\[[\s\S]*?\])\]/);
  if (listMatch) {
    try {
      embeddedVehiclesList = JSON.parse(listMatch[1]);
    } catch {
      // ignore
    }
    clean = clean.replace(/\[VEHICLES_JSON:\s*\[[\s\S]*?\]\]/, '').trim();
  }

  // Match [VEHICLE: {...}]
  const vehMatch = clean.match(/\[VEHICLE:\s*(\{[\s\S]*?\})\]/);
  if (vehMatch) {
    try {
      embeddedVehicle = JSON.parse(vehMatch[1]);
    } catch {
      // ignore
    }
    clean = clean.replace(/\[VEHICLE:\s*\{[\s\S]*?\}\]/, '').trim();
  }

  return {
    cleanBio: clean,
    embeddedSchedule,
    embeddedVehicle,
    embeddedVehiclesList,
  };
}

export function embedBioMetadata(
  bio: string,
  params: {
    schedule?: string | null;
    vehicle?: {
      hasCar: boolean;
      hasMotorcycle: boolean;
      carModel: string;
      carPlate: string;
      carRate: number;
      motorcycleModel: string;
      motorcyclePlate: string;
      motorcycleRate: number;
    } | null;
    vehiclesList?: VehicleEntry[] | null;
  }
): string {
  const { cleanBio } = extractCleanBio(bio);
  const parts = [cleanBio];

  if (params.schedule) {
    parts.push(`[SCHEDULE: ${params.schedule.trim()}]`);
  }

  if (params.vehiclesList && params.vehiclesList.length > 0) {
    parts.push(`[VEHICLES_JSON: ${JSON.stringify(params.vehiclesList)}]`);
  } else if (params.vehicle && (params.vehicle.hasCar || params.vehicle.hasMotorcycle)) {
    parts.push(`[VEHICLE: ${JSON.stringify(params.vehicle)}]`);
  }

  return parts.filter(Boolean).join('\n\n').trim();
}

/**
 * Parses full list of VehicleEntry from bio or columns
 */
export function parseVehiclesList(
  bio?: string | null,
  type?: string | null,
  modelStr?: string | null,
  plateStr?: string | null,
  hourlyRate?: number | null
): VehicleEntry[] {
  const { embeddedVehiclesList } = extractCleanBio(bio);
  if (embeddedVehiclesList && embeddedVehiclesList.length > 0) {
    return embeddedVehiclesList;
  }

  const parsed = parseVehicleDetails(type as VehicleType, modelStr, plateStr, hourlyRate, bio);
  const list: VehicleEntry[] = [];

  if (parsed.hasCar && parsed.car.model) {
    list.push({
      id: 'car-1',
      type: 'car',
      model: parsed.car.model,
      plate: parsed.car.plate,
      rate: parsed.car.rate,
    });
  }

  if (parsed.hasMotorcycle && parsed.motorcycle.model) {
    list.push({
      id: 'moto-1',
      type: 'motorcycle',
      model: parsed.motorcycle.model,
      plate: parsed.motorcycle.plate,
      rate: parsed.motorcycle.rate,
    });
  }

  return list;
}

/**
 * Formats a list of VehicleEntry into standard database fields
 */
export function formatVehiclesToFields(
  vehicles: VehicleEntry[],
  fallbackRate = 250
): {
  vehicle_type: VehicleType;
  vehicle_model: string | null;
  vehicle_plate: string | null;
  hourly_rate: number;
  hasCar: boolean;
  hasMotorcycle: boolean;
  carModel: string;
  carPlate: string;
  carRate: number;
  motorcycleModel: string;
  motorcyclePlate: string;
  motorcycleRate: number;
} {
  if (!vehicles || vehicles.length === 0) {
    return {
      vehicle_type: 'none',
      vehicle_model: null,
      vehicle_plate: null,
      hourly_rate: fallbackRate,
      hasCar: false,
      hasMotorcycle: false,
      carModel: '',
      carPlate: '',
      carRate: 350,
      motorcycleModel: '',
      motorcyclePlate: '',
      motorcycleRate: 280,
    };
  }

  const cars = vehicles.filter((v) => v.type === 'car');
  const motos = vehicles.filter((v) => v.type === 'motorcycle');

  let vType: VehicleType = 'none';
  if (cars.length > 0 && motos.length > 0) {
    vType = 'both';
  } else if (cars.length > 0) {
    vType = cars.length > 1 ? 'both' : 'car';
  } else if (motos.length > 0) {
    vType = motos.length > 1 ? 'both' : 'motorcycle';
  }

  const modelFormatted = vehicles
    .map((v) => `${v.type === 'car' ? '🚗' : '🛵'} ${v.model} [฿${v.rate}]`)
    .join(' | ');

  const plateFormatted = vehicles
    .map((v) => `${v.type === 'car' ? '🚗' : '🛵'} ${v.plate}`)
    .join(' | ');

  const primaryCar = cars[0] || { model: '', plate: '', rate: 350 };
  const primaryMoto = motos[0] || { model: '', plate: '', rate: 280 };

  return {
    vehicle_type: vType,
    vehicle_model: modelFormatted,
    vehicle_plate: plateFormatted,
    hourly_rate: vehicles[0]?.rate || fallbackRate,
    hasCar: cars.length > 0,
    hasMotorcycle: motos.length > 0,
    carModel: primaryCar.model,
    carPlate: primaryCar.plate,
    carRate: primaryCar.rate,
    motorcycleModel: primaryMoto.model,
    motorcyclePlate: primaryMoto.plate,
    motorcycleRate: primaryMoto.rate,
  };
}

/**
 * Parses vehicle details from stored database columns.
 * Supports:
 * 1. Single vehicle types ('car', 'motorcycle', 'none')
 * 2. 'both' with formatted human-readable strings like:
 *    Model: "🚗 รถยนต์: Honda City สีขาว [฿350] | 🛵 มอเตอร์ไซค์: Yamaha Grand Filano [฿280]"
 *    Plate: "🚗 1กข 1234 กทม. | 🛵 2กข 5678 กทม."
 * 3. JSON format fallback if stored as JSON
 * 4. Fallback from embedded metadata in bio
 */
export function parseVehicleDetails(
  type?: VehicleType | string | null,
  modelStr?: string | null,
  plateStr?: string | null,
  hourlyRate?: number | null,
  bio?: string | null
): ParsedVehicleInfo {
  const defaultRate = Number(hourlyRate) || 250;
  const defaultCarRate = defaultRate >= 300 ? defaultRate : 350;
  const defaultMotorcycleRate = defaultRate <= 300 ? defaultRate : 280;

  const result: ParsedVehicleInfo = {
    type: (type as VehicleType) || 'none',
    hasCar: false,
    hasMotorcycle: false,
    car: {
      model: '',
      plate: '',
      rate: defaultCarRate,
    },
    motorcycle: {
      model: '',
      plate: '',
      rate: defaultMotorcycleRate,
    },
    baseRate: defaultRate,
  };

  // Fallback to bio embedded metadata if column is missing or empty
  if ((!type || type === 'none') && !modelStr && bio) {
    const { embeddedVehicle } = extractCleanBio(bio);
    if (embeddedVehicle) {
      result.hasCar = Boolean(embeddedVehicle.hasCar);
      result.hasMotorcycle = Boolean(embeddedVehicle.hasMotorcycle);
      result.car = {
        model: embeddedVehicle.carModel || '',
        plate: embeddedVehicle.carPlate || '',
        rate: Number(embeddedVehicle.carRate) || defaultCarRate,
      };
      result.motorcycle = {
        model: embeddedVehicle.motorcycleModel || '',
        plate: embeddedVehicle.motorcyclePlate || '',
        rate: Number(embeddedVehicle.motorcycleRate) || defaultMotorcycleRate,
      };
      if (result.hasCar && result.hasMotorcycle) {
        result.type = 'both';
      } else if (result.hasCar) {
        result.type = 'car';
      } else if (result.hasMotorcycle) {
        result.type = 'motorcycle';
      }
      return result;
    }
  }

  const cleanModel = (modelStr || '').trim();
  const cleanPlate = (plateStr || '').trim();

  // Try parsing if stored as JSON
  if (cleanModel.startsWith('{')) {
    try {
      const parsedModel = JSON.parse(cleanModel);
      const parsedPlate = cleanPlate.startsWith('{') ? JSON.parse(cleanPlate) : {};

      if (parsedModel.car || parsedModel.hasCar) {
        result.hasCar = true;
        result.car.model = parsedModel.car?.model || parsedModel.car || '';
        result.car.plate = parsedPlate.car || '';
        result.car.rate = Number(parsedModel.car?.rate) || defaultCarRate;
      }
      if (parsedModel.motorcycle || parsedModel.hasMotorcycle) {
        result.hasMotorcycle = true;
        result.motorcycle.model = parsedModel.motorcycle?.model || parsedModel.motorcycle || '';
        result.motorcycle.plate = parsedPlate.motorcycle || '';
        result.motorcycle.rate = Number(parsedModel.motorcycle?.rate) || defaultMotorcycleRate;
      }

      if (result.hasCar && result.hasMotorcycle) {
        result.type = 'both';
      } else if (result.hasCar) {
        result.type = 'car';
      } else if (result.hasMotorcycle) {
        result.type = 'motorcycle';
      } else {
        result.type = 'none';
      }

      return result;
    } catch {
      // Fallback to text parsing if JSON parse failed
    }
  }

  // Handle 'both' or formatted string with delimiter '|'
  if (type === 'both' || cleanModel.includes('|') || cleanPlate.includes('|')) {
    result.type = 'both';
    result.hasCar = true;
    result.hasMotorcycle = true;

    // Parse Model String
    // Expected: "🚗 รถยนต์: {model} [฿{rate}] | 🛵 มอเตอร์ไซค์: {model} [฿{rate}]"
    const modelParts = cleanModel.split('|').map((s) => s.trim());
    for (const part of modelParts) {
      if (part.includes('รถยนต์') || part.includes('🚗')) {
        const rateMatch = part.match(/\[฿?(\d+)\]/);
        if (rateMatch) {
          result.car.rate = Number(rateMatch[1]);
        }
        const cleaned = part
          .replace(/^(🚗\s*รถยนต์:\s*|🚗\s*)/, '')
          .replace(/\s*\[฿?\d+\]$/, '')
          .trim();
        result.car.model = cleaned;
      } else if (part.includes('มอเตอร์ไซค์') || part.includes('จักรยานยนต์') || part.includes('🛵')) {
        const rateMatch = part.match(/\[฿?(\d+)\]/);
        if (rateMatch) {
          result.motorcycle.rate = Number(rateMatch[1]);
        }
        const cleaned = part
          .replace(/^(🛵\s*มอเตอร์ไซค์:\s*|🛵\s*)/, '')
          .replace(/\s*\[฿?\d+\]$/, '')
          .trim();
        result.motorcycle.model = cleaned;
      }
    }

    // Parse Plate String
    // Expected: "🚗 {plate} | 🛵 {plate}"
    const plateParts = cleanPlate.split('|').map((s) => s.trim());
    for (const part of plateParts) {
      if (part.includes('🚗') || part.includes('รถยนต์')) {
        result.car.plate = part.replace(/^(🚗\s*รถยนต์:\s*|🚗\s*)/, '').trim();
      } else if (part.includes('🛵') || part.includes('มอเตอร์ไซค์')) {
        result.motorcycle.plate = part.replace(/^(🛵\s*มอเตอร์ไซค์:\s*|🛵\s*)/, '').trim();
      }
    }

    // Fallback if plate wasn't split by emojis
    if (!result.car.plate && plateParts[0]) {
      result.car.plate = plateParts[0].replace(/^🚗\s*/, '').trim();
    }
    if (!result.motorcycle.plate && plateParts[1]) {
      result.motorcycle.plate = plateParts[1].replace(/^🛵\s*/, '').trim();
    }

    return result;
  }

  // Handle single vehicle 'car'
  if (type === 'car') {
    result.type = 'car';
    result.hasCar = true;
    result.hasMotorcycle = false;
    result.car.model = cleanModel;
    result.car.plate = cleanPlate;
    result.car.rate = defaultRate >= 200 ? defaultRate : 350;
    return result;
  }

  // Handle single vehicle 'motorcycle'
  if (type === 'motorcycle') {
    result.type = 'motorcycle';
    result.hasCar = false;
    result.hasMotorcycle = true;
    result.motorcycle.model = cleanModel;
    result.motorcycle.plate = cleanPlate;
    result.motorcycle.rate = defaultRate >= 200 ? defaultRate : 280;
    return result;
  }

  // 'none'
  result.type = 'none';
  result.hasCar = false;
  result.hasMotorcycle = false;
  return result;
}

/**
 * Formats vehicle details for backward-compatible storage in Supabase:
 * - vehicle_type: 'none' | 'car' | 'motorcycle' | 'both'
 * - vehicle_model: human-readable formatted string
 * - vehicle_plate: human-readable formatted string
 * - hourly_rate: primary/recommended rate
 */
export function formatVehicleDetails(params: {
  hasCar: boolean;
  hasMotorcycle: boolean;
  carModel: string;
  carPlate: string;
  carRate: number;
  motorcycleModel: string;
  motorcyclePlate: string;
  motorcycleRate: number;
  fallbackRate?: number;
}): {
  vehicleType: VehicleType;
  vehicleModel: string | null;
  vehiclePlate: string | null;
  primaryHourlyRate: number;
} {
  const {
    hasCar,
    hasMotorcycle,
    carModel,
    carPlate,
    carRate,
    motorcycleModel,
    motorcyclePlate,
    motorcycleRate,
    fallbackRate = 250,
  } = params;

  if (hasCar && hasMotorcycle) {
    return {
      vehicleType: 'both',
      vehicleModel: `🚗 รถยนต์: ${carModel.trim()} [฿${carRate}] | 🛵 มอเตอร์ไซค์: ${motorcycleModel.trim()} [฿${motorcycleRate}]`,
      vehiclePlate: `🚗 ${carPlate.trim()} | 🛵 ${motorcyclePlate.trim()}`,
      primaryHourlyRate: carRate || fallbackRate,
    };
  }

  if (hasCar) {
    return {
      vehicleType: 'car',
      vehicleModel: carModel.trim() || null,
      vehiclePlate: carPlate.trim() || null,
      primaryHourlyRate: carRate || fallbackRate,
    };
  }

  if (hasMotorcycle) {
    return {
      vehicleType: 'motorcycle',
      vehicleModel: motorcycleModel.trim() || null,
      vehiclePlate: motorcyclePlate.trim() || null,
      primaryHourlyRate: motorcycleRate || fallbackRate,
    };
  }

  return {
    vehicleType: 'none',
    vehicleModel: null,
    vehiclePlate: null,
    primaryHourlyRate: fallbackRate,
  };
}
