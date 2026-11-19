import { Prisma } from '@prisma/client';

/**
 * Recursively serializes Prisma model outputs for the frontend:
 * 1. Attaches `_id: id` to every object that contains an `id` field.
 * 2. Converts Prisma `Decimal` instances to standard JavaScript `number`s.
 * 3. Handles Date objects and deeply nested arrays/sub-objects.
 */
export function serializePrisma<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Prisma Decimal
  if (data instanceof Prisma.Decimal || (typeof data === 'object' && 'd' in data && 'e' in data && 's' in data)) {
    return Number(data.toString()) as unknown as T;
  }

  // Handle Date
  if (data instanceof Date) {
    return data;
  }

  // Handle Array
  if (Array.isArray(data)) {
    return data.map((item) => serializePrisma(item)) as unknown as T;
  }

  // Handle plain Object
  if (typeof data === 'object' && data.constructor === Object) {
    const serialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializePrisma(value);
    }
    // Inject _id if id exists and _id does not
    if (serialized.id !== undefined && serialized._id === undefined) {
      serialized._id = serialized.id;
    }
    return serialized as T;
  }

  return data;
}

/**
 * Converts a JavaScript number or numeric string to a Prisma.Decimal.
 */
export function toDecimal(val: number | string | Prisma.Decimal): Prisma.Decimal {
  if (val instanceof Prisma.Decimal) return val;
  return new Prisma.Decimal(typeof val === 'number' ? val.toFixed(2) : val);
}

export default serializePrisma;
