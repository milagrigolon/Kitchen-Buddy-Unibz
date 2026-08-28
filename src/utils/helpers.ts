import { Category, ConfectionType, DietaryTag, GroceryItem, Ingredient, Location, RipenessStatus, Shop, Unit } from '../types';
import { MS_PER_DAY, OPEN_ITEM_DAYS, RIPENESS_CHECK_DAYS} from '../constants/options';

/**
 * Pure helper functions for Kitchen Buddy.
 * These functions are designed to be independent of React or any other framework,
 * and can be used in any JavaScript/TypeScript environment.
 * They handle tasks such as date calculations, ingredient filtering, 
 * and data transformations.
 */

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

export const isPastExpiration = (exp: string): boolean => {
  if (!exp || !exp.trim()) return false;

  const { timestamp } = parseExpiration(exp);
  if (timestamp === null) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return timestamp < today.getTime();
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
  quantity?: number | null;
  unit?: Unit | null;
  consumedPercentage?: number;
  ripeness?: RipenessStatus | null;
  isOpen?: boolean;
  isFrozen?: boolean;
  barcode?: string | null;
  brand?: string | null;
  dietaryTags?: DietaryTag[]; 
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
  dietaryTags,
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
    dietaryTags: dietaryTags ?? previousIngredient?.dietaryTags ?? [],
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

export const getRecentlyAdded = (ingredients: Ingredient[], limit = 5): Ingredient[] => {
  const sorted = [...ingredients].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  return limit ? sorted.slice(0, limit) : sorted;
};

export const filterRecentlyBoughtIngredients = (ingredients: Ingredient[]): Ingredient[] => {
  return ingredients.filter((item) => item.isRecentlyBought === true);
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

export const getQuantityStep = (unit: Unit | null): number => {
  return unit === 'kg' || unit === 'l' ? 0.25 : 1;
};

export const isLowOrEmpty = (ingredient: Ingredient): boolean => {
  const consumedPercentage = ingredient.consumedPercentage ?? 0;
  
  if (consumedPercentage >= 75) {
    return true;
  }

  if (ingredient.quantity === null || ingredient.quantity === undefined) {
    return false;
  }

  const quantity = ingredient.quantity;
  const unit = ingredient.unit ?? 'pcs';

  if (quantity === 0) {
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
    quantity: null,
    unit: groceryItem.unit ?? source?.unit ?? null,
    consumedPercentage: 0,
    ripeness: null,
    isOpen: false,
    isFrozen: source?.isFrozen ?? false,
    barcode: source?.barcode ?? null,
    brand: source?.brand ?? null,
  });
};

const groceryFitsShop = (item: GroceryItem, shop: Shop): boolean => {
  const text = item.name.toLowerCase();
  const dairyNames = /milk|yogurt|cheese|butter|cream|latte|formaggio|burro|panna/;
  const pantryNames = /pasta|rice|flour|cereal|tomato|oil|salt|sugar|pepper|coffee|riso|farina|cereali|pomodoro|olio|sale|zucchero|pepe|caff/;
  const bakeryNames = /bread|bagel|croissant|cake|pie|bun|pane|focaccia|brioche|torta|pasticceria/;
  const fruitNames = /apple|banana|orange|pear|grape|fruit|berries|mela|arancia|pera|uva|frutta|fragole/;
  const vegetableNames = /vegetable|lettuce|spinach|tomato|carrot|pepper|onion|celery|cucumber|verdure|lattuga|spinaci|carota|peperone|cipolla|sedano|cetriolo|pomodoro/;
  const meatNames = /meat|beef|chicken|pork|sausage|steak|carne|pollo|maiale|salsiccia|bistecca/;
  const fishNames = /fish|salmon|tuna|shrimp|seafood|pesce|salmone|tonno|gamberi/;

  if (shop.type === 'general') {
    return (
      item.category === 'fruit' ||
      item.category === 'vegetable' ||
      item.category === 'dairy' ||
      item.category === 'liquid' ||
      item.category === 'grains' ||   
      item.category === 'bakery' ||
      dairyNames.test(text) ||
      pantryNames.test(text) ||
      bakeryNames.test(text) ||
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

  if (shop.type === 'greengrocer') {
    return (
      item.category === 'fruit' ||
      item.category === 'vegetable' ||
      fruitNames.test(text) ||
      vegetableNames.test(text)
    );
  }

  if (shop.type === 'bakery') {
    return item.category === 'bakery' || bakeryNames.test(text);
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

  if (shop.type === 'greengrocer') {
    return ['Apples', 'Bananas', 'Tomatoes', 'Salad'];
  }

  if (shop.type === 'bakery') {
    return ['Bread', 'Croissant', 'Focaccia', 'Baguette'];
  }

  return ['Milk', 'Pasta', 'Vegetables', 'Fruit', 'Bread'];
};