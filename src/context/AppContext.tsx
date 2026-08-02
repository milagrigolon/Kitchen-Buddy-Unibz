// Shared application state for Kitchen Buddy.
// This provider is the Single Source of Truth for ingredients and groceries.
// All screens rely on the data exposed here, so queries remain derived and
// consistent rather than duplicated in multiple locations.

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_SHOPS, MAX_DISTANCE_METERS } from '../constants/options';
import { usePersistentState } from '../hooks/usePersistentState';
import { GroceryItem, Ingredient, Shop } from '../types';

interface AppContextType {
  ingredients: Ingredient[];
  groceries: GroceryItem[];
  nearbyShop: Shop | null;
  status: 'booting' | 'ready';
  addIngredient: (ingredient: Ingredient) => void;
  updateIngredient: (updatedIngredient: Ingredient) => void;
  removeIngredient: (id: string) => void;
  deleteIngredient: (id: string) => void;
  addGroceryFromIngredient: (ingredient: Ingredient) => void;
  quickAddGrocery: (name: string) => void;
  buyGrocery: (id: string) => void;
  deleteGrocery: (id: string) => void;
  activeIngredients: Ingredient[];
  lowIngredients: Ingredient[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * AppProvider owns the global application state and exposes a clean API for all
 * screens. The provider keeps state updates immutable and stores only the
 * minimum necessary data in one place.
 */
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ingredients, setIngredients] = usePersistentState<Ingredient[]>('kitchen-buddy-ingredients', []);
  const [groceries, setGroceries] = usePersistentState<GroceryItem[]>('kitchen-buddy-groceries', []);
  const [nearbyShop, setNearbyShop] = useState<Shop | null>(null);
  const [status, setStatus] = useState<'booting' | 'ready'>('booting');

  useEffect(() => {
    let isMounted = true;

    const detectNearbyShop = async (): Promise<void> => {
      try {
        const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
        if (permissionStatus !== 'granted') {
          if (isMounted) {
            setNearbyShop(null);
            setStatus('ready');
          }
          return;
        }

        const currentPosition = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const { latitude, longitude } = currentPosition.coords;

        const nearestShop = DEFAULT_SHOPS.reduce<Shop | null>((closest, shop) => {
          const distanceInMeters = Math.sqrt(
            Math.pow(latitude - shop.latitude, 2) + Math.pow(longitude - shop.longitude, 2)
          ) * 111_000;

          if (distanceInMeters <= MAX_DISTANCE_METERS && (!closest || distanceInMeters < closest.radiusMeters)) {
            return shop;
          }

          return closest;
        }, null);

        if (isMounted) {
          setNearbyShop(nearestShop);
          setStatus('ready');
        }
      } catch (error) {
        console.warn('Unable to resolve nearby store', error);
        if (isMounted) {
          setNearbyShop(null);
          setStatus('ready');
        }
      }
    };

    void detectNearbyShop();

    return () => {
      isMounted = false;
    };
  }, []);

  const addIngredient = (ingredient: Ingredient): void => {
    setIngredients((prev) => [ingredient, ...prev]);
  };

  const updateIngredient = (updatedIngredient: Ingredient): void => {
    setIngredients((prev) => prev.map((item) => (item.id === updatedIngredient.id ? updatedIngredient : item)));
  };

  const removeIngredient = (id: string): void => {
    setIngredients((prev) => prev.filter((item) => item.id !== id));
  };

  const deleteIngredient = (id: string): void => {
    setIngredients((prev) => prev.filter((item) => item.id !== id));
  };

  const addGroceryFromIngredient = (ingredient: Ingredient): void => {
    const groceryItem: GroceryItem = {
      id: `grocery-${ingredient.id}-${Date.now()}`,
      name: ingredient.name,
      quantity: ingredient.quantity ?? 1,
      unit: ingredient.unit ?? 'pcs',
      createdAt: new Date().toISOString(),
      sourceIngredientId: ingredient.id,
      isBought: false,
    };

    setGroceries((prev) => [groceryItem, ...prev]);
  };

  const quickAddGrocery = (name: string): void => {
    const cleanName = name.trim();
    if (!cleanName) {
      return;
    }

    const groceryItem: GroceryItem = {
      id: `quick-${Date.now()}`,
      name: cleanName,
      quantity: 1,
      unit: 'pcs',
      createdAt: new Date().toISOString(),
      sourceIngredientId: null,
      isBought: false,
    };

    setGroceries((prev) => [groceryItem, ...prev]);
  };

  const buyGrocery = (id: string): void => {
    setGroceries((prev) => prev.filter((item) => item.id !== id));
  };

  const deleteGrocery = (id: string): void => {
    setGroceries((prev) => prev.filter((item) => item.id !== id));
  };

  const activeIngredients = useMemo(() => ingredients, [ingredients]);
  const lowIngredients = useMemo(
    () => ingredients.filter((item) => (item.quantity ?? 0) <= 1),
    [ingredients]
  );

  const value: AppContextType = {
    ingredients,
    groceries,
    nearbyShop,
    status,
    addIngredient,
    updateIngredient,
    removeIngredient,
    deleteIngredient,
    addGroceryFromIngredient,
    quickAddGrocery,
    buyGrocery,
    deleteGrocery,
    activeIngredients,
    lowIngredients,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const useIngredients = (): Pick<AppContextType, 'ingredients' | 'addIngredient' | 'updateIngredient' | 'removeIngredient' | 'deleteIngredient' | 'activeIngredients'> => {
  const context = useAppContext();
  return {
    ingredients: context.ingredients,
    addIngredient: context.addIngredient,
    updateIngredient: context.updateIngredient,
    removeIngredient: context.removeIngredient,
    deleteIngredient: context.deleteIngredient,
    activeIngredients: context.activeIngredients,
  };
};

export const useGroceries = (): Pick<AppContextType, 'groceries' | 'addGroceryFromIngredient' | 'quickAddGrocery' | 'buyGrocery' | 'deleteGrocery'> => {
  const context = useAppContext();
  return {
    groceries: context.groceries,
    addGroceryFromIngredient: context.addGroceryFromIngredient,
    quickAddGrocery: context.quickAddGrocery,
    buyGrocery: context.buyGrocery,
    deleteGrocery: context.deleteGrocery,
  };
};

export const useNearbyShop = (): Pick<AppContextType, 'nearbyShop'> => {
  const context = useAppContext();
  return { nearbyShop: context.nearbyShop };
};

export const useAppStatus = (): Pick<AppContextType, 'status' | 'nearbyShop' | 'lowIngredients'> => {
  const context = useAppContext();
  return {
    status: context.status,
    nearbyShop: context.nearbyShop,
    lowIngredients: context.lowIngredients,
  };
};