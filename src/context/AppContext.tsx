// src/context/AppContext.tsx
// Shared application state for the ingredient workflow.
// This provider keeps the ingredient list in one place so the different tabs
// can read and update the same source of truth.

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Ingredient } from '../types';

interface AppContextType {
    ingredients: Ingredient[];
    handleAdd: (ingredient: Ingredient) => void;
    handleUpdate: (updatedIngredient: Ingredient) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// AppProvider stores the ingredient collection and exposes the actions needed
// to add a new item or update an existing one from any screen.
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Start with a clean, empty state so the user sees only real input.
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);

    // handleAdd inserts the new ingredient at the beginning of the list so the
    // latest item is always visible first.
    const handleAdd = (ingredient: Ingredient) => {
        setIngredients((prev) => [ingredient, ...prev]);
    };

    // handleUpdate replaces the ingredient with the same identifier and keeps the
    // rest of the list unchanged.
    const handleUpdate = (updatedIngredient: Ingredient) => {
        setIngredients((prev) =>
            prev.map((ing) => (ing.id === updatedIngredient.id ? updatedIngredient : ing))
        );
    };

    return (
        <AppContext.Provider value={{ ingredients, handleAdd, handleUpdate }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};