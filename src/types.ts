// shared TYPES (Domain Model) for Kitchen Buddy

export type Category = 'fruit' | 'vegetable' | 'dairy' | 'fish' | 'meat' | 'liquid' | 'other';
export type Location = 'fridge' | 'freezer' | 'pantry';
export type ConfectionType = 'fresh' | 'canned' | 'frozen' | 'cured';
export type RipenessStatus = 'green' | 'ripe' | 'advanced' | 'too ripe';
export type Unit = 'pcs' | 'kg' | 'l';
export type ShopType = 'general' | 'butcher' | 'fishmonger';
export type QueryMode = 'all' | 'missing' | 'recent_added' | 'recently_bought' | 'ripeness_check';

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
  consumedPercentage?: number;
  barcode?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  isRecent?: boolean;
  isInGroceryList?: boolean;
};

export type GroceryItem = {
  id: string;
  name: string;
  category?: Category | null;
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

