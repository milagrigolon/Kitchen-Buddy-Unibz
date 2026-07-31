// src/utils/constants.ts
// Static option catalogs used by the chip selectors in the forms and list view.
// These values are shared so the UI stays consistent across screens.

import { Category, Location, ConfectionType } from '../types';

export interface OptionItem<T> {
    label: string;
    value: T;
    icon: string;
    iconFamily: 'material' | 'fontawesome' | 'ionicons';
}

export const CATEGORIES: OptionItem<Category>[] = [
    { label: 'Fruit', value: 'fruit', icon: 'food-apple', iconFamily: 'material' },
    { label: 'Vegetable', value: 'vegetable', icon: 'carrot', iconFamily: 'fontawesome' },
    { label: 'Dairy', value: 'dairy', icon: 'cheese', iconFamily: 'material' },
    { label: 'Fish', value: 'fish', icon: 'fish-sharp', iconFamily: 'ionicons' },
    { label: 'Meat', value: 'meat', icon: 'food-steak', iconFamily: 'material' },
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
    { label: 'Frozen', value: 'frozen', icon: 'snowflake-thermometer', iconFamily: 'material' },
    { label: 'Cured', value: 'cured', icon: 'sausage', iconFamily: 'material' },
];

export const MS_PER_DAY = 24 * 60 * 60 * 1000;