// src/utils/helpers.ts

import { Ingredient, Category, Location, ConfectionType, RipenessStatus, Unit } from '../types';
import { MS_PER_DAY } from './constants';

/**
 * Map a quick estimate such as "1 week" to the corresponding number of days.
 */
const getDaysToAdd = (exp: string): number => {
  const mapping: Record<string, number> = {
    '1 week': 7,
    '10 days': 10,
    '1 month': 30,
  };

  return mapping[exp] || 0;
};

/**
 * Parse a user-facing expiration expression into:
 * - the display string
 * - a numeric timestamp suitable for filter logic
 */
export const parseExpiration = (exp: string): { finalExp: string; timestamp: number | null } => {
  if (!exp) return { finalExp: '', timestamp: null };

  const cleanExp = exp.toLowerCase().trim();
  const daysToAdd = getDaysToAdd(cleanExp);

  // Case 1: quick estimate selected by the user
  if (daysToAdd > 0) {
    const d = new Date(Date.now() + daysToAdd * MS_PER_DAY);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return {
      finalExp: `${day}/${month}/${year}`,
      timestamp: d.getTime(),
    };
  }

  // Case 2: exact date entered in DD/MM/YYYY format
  if (exp.includes('/')) {
    const [day, month, year] = exp.split('/');

    if (day && month && year) {
      const parsed = new Date(`${year}-${month}-${day}T00:00:00`);
      return {
        finalExp: exp,
        timestamp: isNaN(parsed.getTime()) ? null : parsed.getTime(),
      };
    }
  }

  // Fallback: keep the raw input if the value cannot be interpreted
  return { finalExp: exp, timestamp: null };
};

/**
 * Pure helper used by the form screen to build the final ingredient record.
 * The UI manages state; this function only transforms the input into a domain object.
 */
export interface IngredientDraftInput {
  id: string;
  name: string;
  category: Category | null;
  location: Location | null;
  confectionType: ConfectionType | null;
  expiration: string;
  createdAt: string;
  quantity?: number;
  unit?: Unit;
  consumedPercentage?: number; // ADDED: Optional consumed percentage field
  ripeness?: RipenessStatus | null;
  isOpen?: boolean;
  isFrozen?: boolean;
  barcode?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
}

export const buildIngredientFromDraft = ({
  id,
  name,
  category,
  location,
  confectionType,
  expiration,
  createdAt,
  quantity,
  unit,
  consumedPercentage = 0, // ADDED: destructured with a fallback default of 0
  ripeness,
  isOpen,
  isFrozen,
  barcode,
  brand,
  imageUrl,
}: IngredientDraftInput): Ingredient => {
  const { finalExp, timestamp } = parseExpiration(expiration);

  return {
    id,
    name: name.trim(),
    category,
    location,
    confectionType,
    expirationDate: finalExp,
    expirationTimestamp: timestamp,
    createdAt,
    quantity,
    unit,
    consumedPercentage, // ADDED: passed to the returned Ingredient object
    ripeness,
    isOpen,
    isFrozen,
    barcode,
    brand,
    imageUrl,
  };
};
/**
 * Convert a timestamp into the number of days remaining until expiration.
 *
 * Examples:
 * - 3 days from now => 3
 * - today => 0
 * - already expired => negative value
 */
export const getDaysUntilExpiration = (
  expirationTimestamp: number | null | undefined,
  now = Date.now()
): number | null => {
  if (!expirationTimestamp) {
    return null;
  }

  return Math.ceil((expirationTimestamp - now) / MS_PER_DAY);
};

/**
 * Pure query: keep only the ingredients whose expiration date falls
 * within the selected number of days from now.
 */
export const filterExpiringWithin = (
  ingredients: Ingredient[],
  days: number,
  now = Date.now()
): Ingredient[] => {
  return ingredients.filter((ingredient) => {
    const timestamp = ingredient.expirationTimestamp ?? parseExpiration(ingredient.expirationDate || '').timestamp;
    const daysUntil = getDaysUntilExpiration(timestamp, now);

    return daysUntil !== null && daysUntil >= 0 && daysUntil <= days;
  });
};

/**
 * Query 1: items whose data is incomplete and therefore worth completing later.
 */
export const getMissingDataItems = (ingredients: Ingredient[]): Ingredient[] => {
  return ingredients.filter(
    (ingredient) =>
      !ingredient.category ||
      !ingredient.location ||
      !ingredient.confectionType ||
      !ingredient.expirationDate
  );
};

/**
 * Query 2: most recent items first.
 */
export const getRecentlyAdded = (ingredients: Ingredient[]): Ingredient[] => {
  return [...ingredients].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
};

/**
 * Query 3: search and filter by typed chips.
 */
export const filterIngredients = (
  ingredients: Ingredient[],
  search = '',
  location?: Location | null,
  category?: Category | null,
  confectionType?: ConfectionType | null
): Ingredient[] => {
  const query = search.trim().toLowerCase();

  return ingredients.filter((ingredient) => {
    const matchesSearch = !query || ingredient.name.toLowerCase().includes(query);
    const matchesLocation = !location || ingredient.location === location;
    const matchesCategory = !category || ingredient.category === category;
    const matchesConfection = !confectionType || ingredient.confectionType === confectionType;

    return matchesSearch && matchesLocation && matchesCategory && matchesConfection;
  });
};

/**
 * Checks if the selected confection type is 'fresh', used for Ripeness status
 */
export const isFreshConfection = (confection: ConfectionType | null | undefined): boolean => {
  return confection === 'fresh';
};

/**
 * Returns the step size for quantity operations based on unit.
 * 0.25 for 'kg' or 'l', 1 for 'pcs'.
 */
export const getQuantityStep = (unit: Unit): number => {
  return unit === 'kg' || unit === 'l' ? 0.25 : 1;
};