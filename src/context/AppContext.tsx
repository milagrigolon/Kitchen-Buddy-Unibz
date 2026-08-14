// Global state for ingredients, groceries and nearby-shop detection.

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_SHOPS, MAX_DISTANCE_METERS } from '../constants/options';
import { usePersistentState } from '../hooks/usePersistentState';
import { fetchNearbyShops } from '../services/shopApi';
import { GroceryItem, Ingredient, Shop } from '../types';
import { buildBoughtIngredient, isLowOrEmpty } from '../utils/helpers';

interface AppContextType {
  ingredients: Ingredient[];
  groceries: GroceryItem[];
  nearbyShop: Shop | null;
  status: 'booting' | 'ready';
  activeIngredients: Ingredient[];
  lowIngredients: Ingredient[];
  addIngredient: (ingredient: Ingredient) => void;
  updateIngredient: (ingredient: Ingredient) => void;
  removeIngredient: (id: string) => void;
  deleteIngredient: (id: string) => void;
  addGroceryFromIngredient: (ingredient: Ingredient) => void;
  quickAddGrocery: (name: string) => void;
  buyGrocery: (id: string) => void;
  deleteGrocery: (id: string) => void;
}

type IngredientsHook = Pick<
  AppContextType,
  | 'ingredients'
  | 'activeIngredients'
  | 'addIngredient'
  | 'updateIngredient'
  | 'removeIngredient'
  | 'deleteIngredient'
>;

type GroceriesHook = Pick<
  AppContextType,
  | 'groceries'
  | 'addGroceryFromIngredient'
  | 'quickAddGrocery'
  | 'buyGrocery'
  | 'deleteGrocery'
>;

type AppStatusHook = Pick<
  AppContextType,
  'status' | 'nearbyShop' | 'lowIngredients'
>;

const AppContext = createContext<AppContextType | undefined>(undefined);

const distanceFromShop = (
  latitude: number,
  longitude: number,
  shop: Shop
): number => {
  return (
    Math.sqrt(
      Math.pow(latitude - shop.latitude, 2) +
      Math.pow(longitude - shop.longitude, 2)
    ) * 111_000
  );
};

const nearestShopFrom = (
  latitude: number,
  longitude: number,
  shops: Shop[]
): Shop | null => {
  const nearbyShops = shops
    .map((shop) => {
      return {
        shop,
        distance: distanceFromShop(latitude, longitude, shop),
      };
    })
    .filter((item) => {
      return item.distance <= Math.min(item.shop.radiusMeters, MAX_DISTANCE_METERS);
    })
    .sort((a, b) => a.distance - b.distance);

  return nearbyShops[0]?.shop ?? null;
};

const groceryFromIngredient = (ingredient: Ingredient): GroceryItem => {
  return {
    id: `grocery-${ingredient.id}-${Date.now()}`,
    name: ingredient.name,
    category: ingredient.category,
    quantity: ingredient.quantity ?? 1,
    unit: ingredient.unit ?? 'pcs',
    createdAt: new Date().toISOString(),
    sourceIngredientId: ingredient.id,
    isBought: false,
  };
};

const quickGroceryItem = (name: string): GroceryItem => {
  return {
    id: `quick-${Date.now()}`,
    name,
    category: null,
    quantity: 1,
    unit: 'pcs',
    createdAt: new Date().toISOString(),
    sourceIngredientId: null,
    isBought: false,
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ingredients, setIngredients] =
    usePersistentState<Ingredient[]>('kitchen-buddy-ingredients', []);
  const [groceries, setGroceries] =
    usePersistentState<GroceryItem[]>('kitchen-buddy-groceries', []);
  const [nearbyShop, setNearbyShop] = useState<Shop | null>(null);
  const [status, setStatus] = useState<'booting' | 'ready'>('booting');

  useEffect(() => {
    let mounted = true;

    const detectNearbyShop = async (): Promise<void> => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== 'granted') {
          if (mounted) {
            setNearbyShop(null);
            setStatus('ready');
          }

          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });

        const { latitude, longitude } = position.coords;
        const apiShops = await fetchNearbyShops(latitude, longitude).catch(() => []);
        const shops = [...apiShops, ...DEFAULT_SHOPS];

        if (mounted) {
          setNearbyShop(nearestShopFrom(latitude, longitude, shops));
          setStatus('ready');
        }
      } catch (error) {
        console.warn('Unable to resolve nearby store', error);

        if (mounted) {
          setNearbyShop(null);
          setStatus('ready');
        }
      }
    };

    void detectNearbyShop();

    return () => {
      mounted = false;
    };
  }, []);

  const addIngredient = (ingredient: Ingredient): void => {
    setIngredients((current) => [ingredient, ...current]);
  };

  const updateIngredient = (ingredientToUpdate: Ingredient): void => {
    setIngredients((current) =>
      current.map((ingredient) => {
        if (ingredient.id !== ingredientToUpdate.id) {
          return ingredient;
        }

        return {
          ...ingredientToUpdate,
          isRecent: false,
        };
      })
    );
  };

  const removeIngredient = (id: string): void => {
    setIngredients((current) =>
      current.filter((ingredient) => ingredient.id !== id)
    );
  };

  const deleteIngredient = (id: string): void => {
    setIngredients((current) =>
      current.filter((ingredient) => ingredient.id !== id)
    );
  };

  const markIngredientAsListed = (ingredientId: string): void => {
    setIngredients((current) =>
      current.map((ingredient) =>
        ingredient.id === ingredientId
          ? { ...ingredient, isInGroceryList: true }
          : ingredient
      )
    );
  };

  const unmarkIngredientAsListed = (ingredientId: string): void => {
    setIngredients((current) =>
      current.map((ingredient) =>
        ingredient.id === ingredientId
          ? { ...ingredient, isInGroceryList: false }
          : ingredient
      )
    );
  };

  const addGroceryFromIngredient = (ingredient: Ingredient): void => {
    const alreadyListed = groceries.some(
      (item) => item.sourceIngredientId === ingredient.id
    );

    if (ingredient.isInGroceryList || alreadyListed) {
      return;
    }

    setGroceries((current) => [groceryFromIngredient(ingredient), ...current]);
    markIngredientAsListed(ingredient.id);
  };

  const quickAddGrocery = (name: string): void => {
    const cleanName = name.trim();

    if (!cleanName) {
      return;
    }

    setGroceries((current) => [quickGroceryItem(cleanName), ...current]);
  };

  const removeGroceryItem = (id: string): void => {
    setGroceries((current) =>
      current.filter((groceryItem) => groceryItem.id !== id)
    );
  };

  const buyGrocery = (id: string): void => {
    const groceryItem = groceries.find((item) => item.id === id);

    if (!groceryItem) {
      return;
    }

    const boughtIngredient = buildBoughtIngredient(groceryItem, ingredients);

    addIngredient({
      ...boughtIngredient,
      isRecent: true,
    });

    removeGroceryItem(id);
  };

  const deleteGrocery = (id: string): void => {
    const groceryItem = groceries.find((item) => item.id === id);

    if (groceryItem?.sourceIngredientId) {
      unmarkIngredientAsListed(groceryItem.sourceIngredientId);
    }

    removeGroceryItem(id);
  };

  const activeIngredients = useMemo(() => ingredients, [ingredients]);

  const lowIngredients = useMemo(() => {
    return ingredients.filter((ingredient) => {
      return !ingredient.isInGroceryList && isLowOrEmpty(ingredient);
    });
  }, [ingredients]);

  const value: AppContextType = {
    ingredients,
    groceries,
    nearbyShop,
    status,
    activeIngredients,
    lowIngredients,
    addIngredient,
    updateIngredient,
    removeIngredient,
    deleteIngredient,
    addGroceryFromIngredient,
    quickAddGrocery,
    buyGrocery,
    deleteGrocery,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }

  return context;
};

export const useIngredients = (): IngredientsHook => {
  const context = useAppContext();

  return {
    ingredients: context.ingredients,
    activeIngredients: context.activeIngredients,
    addIngredient: context.addIngredient,
    updateIngredient: context.updateIngredient,
    removeIngredient: context.removeIngredient,
    deleteIngredient: context.deleteIngredient,
  };
};

export const useGroceries = (): GroceriesHook => {
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

  return {
    nearbyShop: context.nearbyShop,
  };
};

export const useAppStatus = (): AppStatusHook => {
  const context = useAppContext();

  return {
    status: context.status,
    nearbyShop: context.nearbyShop,
    lowIngredients: context.lowIngredients,
  };
};
