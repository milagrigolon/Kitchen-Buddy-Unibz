// Shared domain model for Kitchen Buddy.
// This file preserves the existing ingredient model and extends it to support
// the pair-project features required by the final assignment.

export type Category = 'fruit' | 'vegetable' | 'dairy' | 'fish' | 'meat' | 'liquid' | 'other';
export type Location = 'fridge' | 'freezer' | 'pantry';
export type ConfectionType = 'fresh' | 'canned' | 'frozen' | 'cured';
export type RipenessStatus = 'green' | 'ripe' | 'advanced' | 'too_ripe';
export type Unit = 'pcs' | 'kg' | 'bottle' | 'pack' | 'box';
export type ShopType = 'general' | 'butcher';

export type Ingredient = {
  id: string;
  name: string;
  category: Category | null;
  location: Location | null;
  confectionType: ConfectionType | null;
  expirationDate: string;
  expirationTimestamp: number | null;
  createdAt: string;
  updatedAt?: string;
  ripeness?: RipenessStatus | null;
  lastRipenessCheckAt?: string | null;
  isOpen?: boolean;
  isFrozen?: boolean;
  quantity?: number;
  unit?: Unit;
  barcode?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
};

export type GroceryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  createdAt: string;
  sourceIngredientId?: string | null;
  isBought?: boolean;
};

export type Shop = {
  id: string;
  name: string;
  type: ShopType;
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

