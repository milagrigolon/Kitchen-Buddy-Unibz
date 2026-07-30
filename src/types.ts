// src/types.ts

export type Category = 'fruit' | 'vegetable' | 'dairy' | 'fish' | 'meat' | 'liquid' | 'other';
export type Location = 'fridge' | 'freezer' | 'pantry';
export type ConfectionType = 'fresh' | 'canned' | 'frozen' | 'cured';
export type RipenessStatus = 'green' | 'ripe' | 'advanced' | 'too_ripe';

export interface Ingredient {
    id: string;
    name: string;                   
    category: Category | null;
    location?: Location | null;
    confectionType?: ConfectionType | null;
    expirationDate?: string;        // Date or description
    expirationTimestamp?: number | null; 
    ripeness?: RipenessStatus;
    isOpen?: boolean;
    quantity?: number;
    createdAt: string;
}

