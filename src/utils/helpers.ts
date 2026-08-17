// Pure helper functions for Kitchen Buddy.
// Screens call these functions to keep UI code readable and state updates immutable.

import {
  Category,
  ConfectionType,
  GroceryItem,
  Ingredient,
  Location,
  RipenessStatus,
  Shop,
  Unit,
} from '../types';
import { MS_PER_DAY } from './constants';

const OPEN_ITEM_DAYS = 4;
const RIPENESS_CHECK_DAYS = 3;

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

const addDays = (date: Date, days: number): Date => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const addMonths = (date: Date, months: number): Date => {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
};

const getDaysToAdd = (exp: string): number => {
  const cleanExp = exp.toLowerCase().trim();

  const dayMatch = cleanExp.match(/^(\d+)\s*day(s)?$/);
  if (dayMatch) {
    return parseInt(dayMatch[1], 10);
  }

  const weekMatch = cleanExp.match(/^(\d+)\s*week(s)?$/);
  if (weekMatch) {
    return parseInt(weekMatch[1], 10) * 7;
  }

  const monthMatch = cleanExp.match(/^(\d+)\s*month(s)?$/);
  if (monthMatch) {
    return parseInt(monthMatch[1], 10) * 30;
  }

  return 0;
};

export const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseExpiration = (exp: string): { finalExp: string; timestamp: number | null } => {
  const cleanExp = exp.trim();

  if (!cleanExp) {
    return { finalExp: '', timestamp: null };
  }

  const daysToAdd = getDaysToAdd(cleanExp);

  if (daysToAdd > 0) {
    const date = addDays(new Date(), daysToAdd);

    return {
      finalExp: formatDate(date),
      timestamp: date.getTime(),
    };
  }

  if (cleanExp.includes('/')) {
    const [day, month, year] = cleanExp.split('/');
    const parsed = new Date(`${year}-${month}-${day}T00:00:00`);
    return {
      finalExp: cleanExp,
      timestamp: Number.isNaN(parsed.getTime()) ? null : parsed.getTime(),
    };
  }

  if (cleanExp.includes('-')) {
    const parsed = new Date(`${cleanExp}T00:00:00`);
    return {
      finalExp: Number.isNaN(parsed.getTime()) ? cleanExp : formatDate(parsed),
      timestamp: Number.isNaN(parsed.getTime()) ? null : parsed.getTime(),
    };
  }

  return { finalExp: cleanExp, timestamp: null };
};

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
  consumedPercentage?: number;
  ripeness?: RipenessStatus | null;
  isOpen?: boolean;
  isFrozen?: boolean;
  barcode?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  previousIngredient?: Ingredient | null;
}

const applyOpenRules = (
  isOpen: boolean | undefined,
  wasOpen: boolean | undefined,
  finalExp: string,
  timestamp: number | null
): { finalExp: string; timestamp: number | null } => {
  if (!isOpen || wasOpen) {
    return { finalExp, timestamp };
  }

  const openLimit = addDays(new Date(), OPEN_ITEM_DAYS);
  const openLimitTimestamp = openLimit.getTime();

  if (!timestamp || timestamp > openLimitTimestamp) {
    return { finalExp: formatDate(openLimit), timestamp: openLimitTimestamp };
  }

  return { finalExp, timestamp };
};

const applyFrozenRules = (
  isFrozen: boolean | undefined,
  location: Location | null,
  finalExp: string,
  timestamp: number | null
): { location: Location | null; finalExp: string; timestamp: number | null } => {
  if (!isFrozen) {
    return { location, finalExp, timestamp };
  }

  const sixMonthsFromNow = addMonths(new Date(), 6);
  const minimumTimestamp = sixMonthsFromNow.getTime();
  const shouldExtendExpiration = !timestamp || timestamp < minimumTimestamp;

  return {
    location: 'freezer',
    finalExp: shouldExtendExpiration ? formatDate(sixMonthsFromNow) : finalExp,
    timestamp: shouldExtendExpiration ? minimumTimestamp : timestamp,
  };
};

const applyRipenessRules = (
  confectionType: ConfectionType | null,
  ripeness: RipenessStatus | null | undefined,
  previousIngredient?: Ingredient | null
): { savedRipeness: RipenessStatus | null; ripenessCheckedAt: string | null } => {
  // Ripeness status is only applicable to fresh confectionery items
  const savedRipeness = isFreshConfection(confectionType) ? ripeness ?? null : null;

  // Clear tracking timestamp if no ripeness level is set or item is not fresh
  if (!savedRipeness) {
    return { savedRipeness: null, ripenessCheckedAt: null };
  }
  // Detect if the ripeness value actually changed during this edit
  const hasRipenessChanged = savedRipeness !== (previousIngredient?.ripeness ?? null);
  // Update check timestamp when ripeness changes; otherwise retain existing check date
  const ripenessCheckedAt = hasRipenessChanged
    ? new Date().toISOString()
    : previousIngredient?.lastRipenessCheckAt ?? new Date().toISOString();

  return { savedRipeness, ripenessCheckedAt };
};

export const isFreshConfection = (confection: ConfectionType | null | undefined): boolean => {
  return confection === 'fresh';
};

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
  consumedPercentage = 0,
  ripeness,
  isOpen = false,
  isFrozen = false,
  barcode,
  brand,
  imageUrl,
  previousIngredient,
}: IngredientDraftInput): Ingredient => {
  const parsed = parseExpiration(expiration);

  // OPEN STATUS
  const openData = applyOpenRules(
    isOpen,
    previousIngredient?.isOpen,
    parsed.finalExp,
    parsed.timestamp
  );

  // FROZEN STATUS
  const dataBeforeFrozen = isFrozen ? parsed : openData;
  const frozenData = applyFrozenRules(
    isFrozen,
    location,
    dataBeforeFrozen.finalExp,
    dataBeforeFrozen.timestamp
  );

  // RIPENESS STATUS
  const { savedRipeness, ripenessCheckedAt } = applyRipenessRules(
    confectionType,
    ripeness,
    previousIngredient
  );

  return {
    id,
    name: name.trim(),
    category,
    location: frozenData.location,
    confectionType,
    expirationDate: frozenData.finalExp,
    expirationTimestamp: frozenData.timestamp,
    createdAt,
    updatedAt: new Date().toISOString(),
    quantity,
    unit,
    consumedPercentage,
    ripeness: savedRipeness,
    lastRipenessCheckAt: ripenessCheckedAt,
    isOpen,
    isFrozen,
    barcode: barcode?.trim() || null,
    brand: brand?.trim() || null,
    imageUrl,
    isRecentlyBought: previousIngredient?.isRecentlyBought ?? false,
  };
};

export const getDaysUntilExpiration = (
  expirationTimestamp: number | null | undefined,
  now = Date.now()
): number | null => {
  if (!expirationTimestamp) {
    return null;
  }

  return Math.ceil((expirationTimestamp - now) / MS_PER_DAY);
};

const isRipeEnoughToUse = (ripeness?: RipenessStatus | null): boolean => {
  return ripeness === 'ripe' || ripeness === 'advanced' || ripeness === 'too ripe';
};

export const needsRipenessCheck = (ingredient: Ingredient, now = Date.now()): boolean => {
  if (!ingredient.ripeness) {
    return false;
  }

  if (!ingredient.lastRipenessCheckAt) {
    return true;
  }

  return now - new Date(ingredient.lastRipenessCheckAt).getTime() > RIPENESS_CHECK_DAYS * MS_PER_DAY;
};

export const filterExpiringWithin = (
  ingredients: Ingredient[],
  days: number,
  now = Date.now()
): Ingredient[] => {
  return ingredients.filter((ingredient) => {
    const timestamp = ingredient.expirationTimestamp ?? parseExpiration(ingredient.expirationDate || '').timestamp;
    const daysUntil = getDaysUntilExpiration(timestamp, now);
    const expiresSoon = daysUntil !== null && daysUntil >= 0 && daysUntil <= days;

    if (ingredient.isFrozen) {
      return expiresSoon;
    }

    return expiresSoon || ingredient.isOpen === true || isRipeEnoughToUse(ingredient.ripeness);
  });
};

// QUERY: ingredients with missing data
export const hasMissingDetails = (ingredient: Ingredient): boolean => {
  return (
    !ingredient.category ||
    !ingredient.location ||
    !ingredient.confectionType ||
    !ingredient.expirationDate ||
    ingredient.expirationDate.trim() === '' ||
    (ingredient.confectionType === 'fresh' && !ingredient.ripeness)
  );
};

// QUERY: recently added ingredients (based on date of entry)
export const getRecentlyAdded = (ingredients: Ingredient[], limit = 5): Ingredient[] => {
  const sorted = [...ingredients].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  return limit ? sorted.slice(0, limit) : sorted;
};

// QUERY: recently bought groceries
export const filterRecentlyBoughtIngredients = (ingredients: Ingredient[]): Ingredient[] => {
  return ingredients.filter((item) => item.isRecentlyBought === true);
};

// FILTER INGREDIENTS FUNCTION - can be used for every query mode
export const filterIngredients = (
  ingredients: Ingredient[],
  search = '',
  location?: Location | null,
  category?: Category | null,
  confectionType?: ConfectionType | null
): Ingredient[] => {
  const query = search.trim().toLowerCase();

  return ingredients.filter((ingredient) => {
    const text = `${ingredient.name} ${ingredient.brand ?? ''}`.toLowerCase();
    const matchesSearch = !query || text.includes(query);
    const matchesLocation = !location || ingredient.location === location;
    const matchesCategory = !category || ingredient.category === category;
    const matchesConfection = !confectionType || ingredient.confectionType === confectionType;

    return matchesSearch && matchesLocation && matchesCategory && matchesConfection;
  });
};

export const getQuantityStep = (unit: Unit): number => {
  return unit === 'kg' || unit === 'l' ? 0.25 : 1;
};

/**
 * CHECK for LOW or EMPTY for GROCERIES SUGGESTIONS
 * if the consumed amount is bigger or equal than 75%, then 
 * it is suggested in the "Low stock suggestions"
 */
export const isLowOrEmpty = (ingredient: Ingredient): boolean => {
  const consumedPercentage = ingredient.consumedPercentage ?? 0;
  
  /* PREVIOUS LOGIC CHANGED - previously returned also for 0 pcs/kg/l
  const quantity = ingredient.quantity ?? 0;
  const unit = ingredient.unit ?? 'pcs';
  if (consumedPercentage >= 75) {
    return true;
  }
  if (quantity <= 0) {
    return true;
  }
  return unit === 'pcs' ? quantity <= 1 : quantity <= 0.25; 
  */

  return consumedPercentage >= 75;

};

export const calculateSuggestedExpiry = (
  itemName: string,
  allIngredients: Ingredient[]
): string => {
  const previousItems = allIngredients
    .filter((ingredient) => ingredient.name.trim().toLowerCase() === itemName.trim().toLowerCase())
    .filter((ingredient) => ingredient.expirationTimestamp ?? parseExpiration(ingredient.expirationDate).timestamp)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const previous = previousItems[0];

  if (!previous) {
    return '';
  }

  const previousExpiration =
    previous.expirationTimestamp ?? parseExpiration(previous.expirationDate).timestamp;

  if (!previousExpiration) {
    return '';
  }

  const boughtAt = new Date(previous.createdAt).getTime();
  const durationInDays = Math.max(1, Math.ceil((previousExpiration - boughtAt) / MS_PER_DAY));

  return formatDate(addDays(new Date(), durationInDays));
};

export const buildBoughtIngredient = (
  groceryItem: GroceryItem,
  allIngredients: Ingredient[]
): Ingredient => {
  const source =
    groceryItem.sourceIngredientId
      ? allIngredients.find((ingredient) => ingredient.id === groceryItem.sourceIngredientId)
      : getRecentlyAdded(
        allIngredients.filter(
          (ingredient) => ingredient.name.trim().toLowerCase() === groceryItem.name.trim().toLowerCase()
        ),
        1
      )[0];

  return buildIngredientFromDraft({
    id: `ing-${Date.now()}`,
    name: source?.name ?? groceryItem.name,
    category: source?.category ?? null,
    location: source?.location ?? null,
    confectionType: source?.confectionType ?? null,
    expiration: calculateSuggestedExpiry(groceryItem.name, allIngredients),
    createdAt: new Date().toISOString(),
    quantity: groceryItem.quantity ?? source?.quantity ?? 1,
    unit: groceryItem.unit ?? source?.unit ?? 'pcs',
    consumedPercentage: 0,
    ripeness: null,
    isOpen: false,
    isFrozen: source?.isFrozen ?? false,
    barcode: source?.barcode ?? null,
    brand: source?.brand ?? null,
    imageUrl: source?.imageUrl ?? null,
  });
};

const groceryFitsShop = (item: GroceryItem, shop: Shop): boolean => {
  const text = item.name.toLowerCase();
  const dairyNames = /milk|yogurt|cheese|butter|cream|latte|yogurt|formaggio|burro|panna/;
  const pantryNames = /pasta|rice|flour|bread|cereal|tomato|oil|salt|sugar|pepper|coffee|pasta|riso|farina|pane|cereali|pomodoro|olio|sale|zucchero|pepe|caff/;
  const fruitNames = /apple|banana|orange|pear|grape|fruit|berries|apple|banana|arancia|pera|uva|frutta|fragole|mela/;
  const vegetableNames = /vegetable|lettuce|spinach|tomato|carrot|pepper|onion|celery|cucumber|verdure|lattuga|spinaci|carota|peperone|cipolla|sedano|cetriolo|pomodoro/;
  const meatNames = /meat|beef|chicken|pork|sausage|steak|carne|pollo|maiale|salsiccia|bistecca/;
  const fishNames = /fish|salmon|tuna|shrimp|seafood|pesce|salmone|tonno|gamberi/;

  if (shop.type === 'general') {
    return (
      item.category === 'fruit' ||
      item.category === 'vegetable' ||
      item.category === 'dairy' ||
      item.category === 'liquid' ||
      dairyNames.test(text) ||
      pantryNames.test(text) ||
      fruitNames.test(text) ||
      vegetableNames.test(text)
    );
  }

  if (shop.type === 'butcher') {
    return item.category === 'meat' || meatNames.test(text);
  }

  if (shop.type === 'fishmonger') {
    return item.category === 'fish' || fishNames.test(text);
  }

  return false;
};

export const sortGroceriesForShop = (items: GroceryItem[], shop: Shop | null): GroceryItem[] => {
  const sortedByDate = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (!shop) {
    return sortedByDate;
  }

  return sortedByDate.sort((a, b) => {
    const aPriority = groceryFitsShop(a, shop) ? 1 : 0;
    const bPriority = groceryFitsShop(b, shop) ? 1 : 0;

    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
};


export const nearbyStoreSuggestions = (shop: Shop | null): string[] => {
  if (!shop) {
    return [];
  }

  if (shop.type === 'butcher') {
    return ['Meat', 'Chicken', 'Sausages'];
  }

  if (shop.type === 'fishmonger') {
    return ['Fish', 'Salmon', 'Tuna'];
  }

  return ['Milk', 'Pasta', 'Vegetables', 'Fruit', 'Bread'];
};
