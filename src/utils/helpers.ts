// src/utils/helpers.ts

import { Ingredient, Category, Location, ConfectionType, RipenessStatus, Unit, GroceryItem } from '../types';
import { MS_PER_DAY } from './constants';

/**
 * Map a dynamic expiration expression such as "4 days", "2 weeks", "7 months"
  * to the corresponding number of days.
 */
const getDaysToAdd = (exp: string): number => {
  const cleanExp = exp.toLowerCase().trim();

  // 1. match dynamic days (e.g., "4 days", "1 day")
  const dayMatch = cleanExp.match(/^(\d+)\s*day(s)?$/);
  if (dayMatch) {
    return parseInt(dayMatch[1], 10);
  }

  // 2. match dynamic weeks (e.g., "2 weeks", "1 week", "8 weeks")
  const weekMatch = cleanExp.match(/^(\d+)\s*week(s)?$/);
  if (weekMatch) {
    return parseInt(weekMatch[1], 10) * 7;
  }

  // 3. match dynamic months (e.g., "7 months", "1 month")
  const monthMatch = cleanExp.match(/^(\d+)\s*month(s)?$/);
  if (monthMatch) {
    return parseInt(monthMatch[1], 10) * 30; // standard approximation of a month in days
  }

  // 4. fallback static mapping
  const mapping: Record<string, number> = {
    '1 week': 7,
    '10 days': 10,
    '1 month': 30,
  };

  return mapping[cleanExp] || 0;
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
  consumedPercentage?: number; // ADDED: optional consumed percentage field
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

  // optional FROZEN handling: if frozen, moves the location to 'freezer' 
  // and calculates the expiring date to be in 6 months
  // const frozenData = applyFrozenRules(isFrozen, location, finalExp, timestamp);

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
    // if the ingredient is open, immediately include it in "Expiring Soon"
    if (ingredient.isOpen) {
      return true;
    }

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
 * Query 2: most recent items first (limited to 5 items)
 */
export const getRecentlyAdded = (ingredients: Ingredient[], limit = 5): Ingredient[] => {
  const sorted = [...ingredients].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });
  return limit ? sorted.slice(0, limit) : sorted;
};

/**
 * Query 2.1: Filter ingredients for RECENT BOUGHT (isRecent === true)
 */
export const filterRecentIngredients = (ingredients: Ingredient[]): Ingredient[] => {
  return ingredients.filter((item) => item.isRecent === true);
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
 * Helper to handle FROZEN RULES: forces location to 'freezer' and 
 * sets an extended expiration of up to 6 months if not provided.
 */
export const applyFrozenRules = (
  isFrozen?: boolean,
  location?: Location | null,
  finalExp?: string,
  ) => {
    if (!isFrozen) {
      return { location, finalExp };
    }
    let baseDate = new Date();

  // Se c'era già una data in formato DD/MM/YYYY, usala come partenza
    if (finalExp && finalExp.includes('/')) {
      const parts = finalExp.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          baseDate = new Date(year, month, day);
          }
    }
  }

  // Aggiunge 6 mesi alla data di partenza
  baseDate.setMonth(baseDate.getMonth() + 6);

  const day = String(baseDate.getDate()).padStart(2, '0');
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  const year = baseDate.getFullYear();

  return {
    location: 'freezer' as Location,
    finalExp: `${day}/${month}/${year}`,
  };
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

/**
 * Calculates expiring date proposed for ingredient recently bought based on
 * a product already in the items.
 */
export const calculateSuggestedExpiry = (
  itemName: string,
  allIngredients: Ingredient[]
): string => {
  const existingIngredient = allIngredients.find(
    (ing) => ing.name.toLowerCase() === itemName.toLowerCase()
  );

  if (existingIngredient && existingIngredient.expirationDate) {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 7);
    return newExpiry.toISOString().split('T')[0];
  }

  return '';
};
