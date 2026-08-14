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
  const openData = applyOpenRules(
    isOpen,
    previousIngredient?.isOpen,
    parsed.finalExp,
    parsed.timestamp
  );
  const dataBeforeFrozen = isFrozen ? parsed : openData;
  const frozenData = applyFrozenRules(
    isFrozen,
    location,
    dataBeforeFrozen.finalExp,
    dataBeforeFrozen.timestamp
  );
  const savedRipeness = isFreshConfection(confectionType) ? ripeness ?? null : null;
  const ripenessCheckedAt = savedRipeness ? new Date().toISOString() : null;

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
    isRecent: previousIngredient?.isRecent ?? false,
    isInGroceryList: previousIngredient?.isInGroceryList ?? false,
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

export const getMissingDataItems = (ingredients: Ingredient[]): Ingredient[] => {
  return ingredients.filter(
    (ingredient) =>
      !ingredient.category ||
      !ingredient.location ||
      !ingredient.confectionType ||
      !ingredient.expirationDate
  );
};

export const getRecentlyAdded = (ingredients: Ingredient[], limit = 5): Ingredient[] => {
  const sorted = [...ingredients].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  return limit ? sorted.slice(0, limit) : sorted;
};

export const filterRecentIngredients = (ingredients: Ingredient[]): Ingredient[] => {
  return ingredients.filter((item) => item.isRecent === true);
};

export const filterNeedsRipenessCheck = (ingredients: Ingredient[], now = Date.now()): Ingredient[] => {
  return ingredients.filter((ingredient) => needsRipenessCheck(ingredient, now));
};

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

export const isLowOrEmpty = (ingredient: Ingredient): boolean => {
  const consumedPercentage = ingredient.consumedPercentage ?? 0;
  const quantity = ingredient.quantity ?? 0;
  const unit = ingredient.unit ?? 'pcs';

  if (consumedPercentage >= 75) {
    return true;
  }

  if (quantity <= 0) {
    return true;
  }

  return unit === 'pcs' ? quantity <= 1 : quantity <= 0.25;
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
  if (shop.type === 'general') {
    return true;
  }

  const text = item.name.toLowerCase();
  const meatNames = /meat|beef|chicken|pork|sausage|steak|carne|pollo|salsiccia/;
  const fishNames = /fish|salmon|tuna|shrimp|seafood|pesce|salmone|tonno|gamberi/;

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

  if (!shop || shop.type === 'general') {
    return sortedByDate;
  }

  return sortedByDate
    .filter((item) => groceryFitsShop(item, shop) || !item.sourceIngredientId)
    .sort((a, b) => Number(!groceryFitsShop(a, shop)) - Number(!groceryFitsShop(b, shop)));
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

  return ['Milk', 'Pasta', 'Vegetables'];
};
