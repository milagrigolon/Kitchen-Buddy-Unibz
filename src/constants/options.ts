/**
 * constants/options.ts 
 * contains the definitions for various option lists used throughout the application, 
 * such as categories, locations, confections, dietary options, ripeness levels, and default shops. 
 * These constants are used to populate dropdowns and selection components in the UI.
 */

import { Category, ConfectionType, Location, DietaryTag, RipenessStatus, Shop, Unit, QueryOption} from '../types';

export type OptionItem<T extends string> = {
  label: string;
  value: T;
  icon: string;
  iconFamily: 'material' | 'fontawesome' | 'ionicons';
};

export const CATEGORIES: OptionItem<Category>[] = [
  { label: 'Fruit', value: 'fruit', icon: 'food-apple', iconFamily: 'material' },
  { label: 'Vegetable', value: 'vegetable', icon: 'carrot', iconFamily: 'fontawesome' },
  { label: 'Dairy', value: 'dairy', icon: 'cheese', iconFamily: 'material' },
  { label: 'Fish', value: 'fish', icon: 'fish-sharp', iconFamily: 'ionicons' },
  { label: 'Meat', value: 'meat', icon: 'food-steak', iconFamily: 'material' },
  { label: 'Grains', value: 'grains', icon: 'barley', iconFamily: 'material' },
  { label: 'Bakery', value: 'bakery', icon: 'bread-slice', iconFamily: 'material' },
  { label: 'Liquid', value: 'liquid', icon: 'water', iconFamily: 'material' },
  { label: 'Other', value: 'other', icon: 'basket-shopping', iconFamily: 'fontawesome' },
];

export const LOCATIONS: OptionItem<Location>[] = [
  { label: 'Fridge', value: 'fridge', icon: 'fridge', iconFamily: 'material' },
  { label: 'Freezer', value: 'freezer', icon: 'snowflake', iconFamily: 'material' },
  { label: 'Pantry', value: 'pantry', icon: 'cupboard', iconFamily: 'material' },
];

export const CONFECTIONS: OptionItem<ConfectionType>[] = [
  { label: 'Fresh', value: 'fresh', icon: 'leaf-sharp', iconFamily: 'ionicons' },
  { label: 'Canned', value: 'canned', icon: 'jar', iconFamily: 'fontawesome' },
  { label: 'Frozen', value: 'frozen', icon: 'snowflake', iconFamily: 'material' },
  { label: 'Cured', value: 'cured', icon: 'sausage', iconFamily: 'material' },
  { label: 'Packaged', value: 'packaged', icon: 'package-variant', iconFamily: 'material' },
];

export const DIETARY_OPTIONS: { value: DietaryTag; label: string }[] = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'lactose-free', label: 'Lactose-free' },
];

export const RIPENESS_LEVELS: OptionItem<RipenessStatus>[] = [
  { label: 'Green', value: 'green', icon: 'leaf', iconFamily: 'material' },
  { label: 'Ripe', value: 'ripe', icon: 'check-circle', iconFamily: 'material' },
  { label: 'Advanced', value: 'advanced', icon: 'alert-circle', iconFamily: 'material' },
  { label: 'Too Ripe', value: 'too ripe', icon: 'warning-sharp', iconFamily: 'ionicons' },
];

// DEFAULT SHOPS FOR TESTING
export const DEFAULT_SHOPS: Shop[] = [
  {
    id: 'general-market',
    name: 'General Market NOI',
    type: 'general',
    latitude: 46.470,
    longitude: 11.330,
    radiusMeters: 150,
  },
  {
    id: 'butcher-shop',
    name: 'Butcher Shop Isera',
    type: 'butcher',
    latitude: 45.8837737,
    longitude: 11.0063170,
    radiusMeters: 140,
  },
  {
    id: 'fish-market',
    name: 'Fish Market - via Fago',
    type: 'fishmonger',
    latitude: 46.496,
    longitude: 11.338,
    radiusMeters: 140,
  },
  {
    id: 'local-bakery',
    name: 'Mosaico Aquileia',
    type: 'bakery',
    latitude: 45.7589000,
    longitude: 13.366100,
    radiusMeters: 140,
  },
    {
    id: 'greengrocerey-shop',
    name: 'Fruttivendolo Bolzano Centro',
    type: 'greengrocer',
    latitude: 46.4989,
    longitude: 11.3506,
    radiusMeters: 140,
  },


];

export const QUERY_OPTIONS: QueryOption[] = [
  { label: 'All', value: 'all' },
  { label: 'Recent', value: 'recent_added' },
  { label: 'Recently Bought', value: 'recently_bought' },
];

export const DEFAULT_UNITS: Unit[] = ['pcs', 'kg', 'l'];

export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const MAX_DISTANCE_METERS = 200;
export const OPEN_ITEM_DAYS = 4;
export const RIPENESS_CHECK_DAYS = 3;


