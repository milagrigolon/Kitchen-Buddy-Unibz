// shared TYPES (Domain Model) for Kitchen Buddy

export type Category = 'fruit' | 'vegetable' | 'dairy' | 'fish' | 'meat' | 'liquid' | 'grains' | 'bakery' | 'other';
export type Location = 'fridge' | 'freezer' | 'pantry';
export type ConfectionType = 'fresh' | 'canned' | 'frozen' | 'cured'| 'packaged';
export type RipenessStatus = 'green' | 'ripe' | 'advanced' | 'too ripe';
export type Unit = 'pcs' | 'kg' | 'l';
export type ShopType = 'general' | 'butcher' | 'fishmonger'|'bakery'|'greengrocer';
export type QueryMode = 'all' | 'recent_added' | 'recently_bought' ;
export type DietaryTag = 'vegan' | 'vegetarian' | 'halal' | 'kosher' | 'gluten-free'| 'lactose-free' ;


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
  quantity?: number | null;
  unit?: Unit |null ;
  consumedPercentage?: number;
  barcode?: string | null;
  brand?: string | null;
  isRecentlyBought?: boolean;
  dietaryTags?: DietaryTag[];
};

export type GroceryItem = {
  id: string;
  name: string;
  category?: Category | null;
  quantity: number |null;
  unit: Unit | null;
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

export type QueryOption = {
  label: string;
  value: QueryMode;
};
