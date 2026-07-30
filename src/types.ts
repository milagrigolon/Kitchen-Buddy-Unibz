// src/types.ts

export type Category = 'fruit' | 'vegetable' | 'dairy' | 'fish' | 'meat' | 'liquid' | 'other';
export type Location = 'fridge' | 'freezer' | 'pantry';
export type ConfectionType = 'fresh' | 'canned' | 'frozen' | 'cured';

export interface Ingredient {
    id: string;
    name: string;                   // UNICO CAMPO OBBLIGATORIO
    category?: Category | null;
    location?: Location | null;
    confectionType?: ConfectionType | null;
    expirationDate?: string;        // Data esatta o descrizione (es. "1 week from now")
    expirationTimestamp?: number | null; // Usato per ordinare e filtrare
    createdAt: number;
}