// Global state for ingredients, groceries and nearby-shop detection.
//
// Architectural intent:
// - `AppProvider` owns the app-wide state and exposes it through typed hooks.
// - persisted values (`ingredients`, `groceries`) live in AsyncStorage through
//   `usePersistentState`, while local UI state (`nearbyShop`, `status`) stays in React state.
// - derived values such as `lowIngredients` are computed with `useMemo` from the real source
//   of truth instead of being stored separately and then forgotten.

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

const normalizeItemName = (name: string): string => name.trim().toLowerCase();

const hasEquivalentGroceryEntry = (
  current: GroceryItem[],
  targetName: string,
  sourceIngredientId?: string | null
): boolean => {
  const normalizedName = normalizeItemName(targetName);

  return current.some((item) => {
    const sameSourceIngredient =
      sourceIngredientId != null && item.sourceIngredientId === sourceIngredientId;
    const sameName =
      item.name && normalizeItemName(item.name) === normalizedName;

    return sameSourceIngredient || sameName;
  });
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

  // Persisted ingredient state: these updates are intentionally written through the
  // functional `setState` form so they are based on the latest snapshot, not a stale closure.
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

  // Grocery items are also persisted, but they are treated as a derived list that can be
  // added from ingredients or typed manually. The duplicate check therefore uses the current
  // grocery snapshot to avoid race conditions during rapid taps.
  const addGroceryFromIngredient = (ingredient: Ingredient): void => {
    setGroceries((current) => {
      if (hasEquivalentGroceryEntry(current, ingredient.name, ingredient.id)) {
        return current;
      }

      return [groceryFromIngredient(ingredient), ...current];
    });
  };

  const quickAddGrocery = (name: string): void => {
    const cleanName = name.trim();

    if (!cleanName) {
      return;
    }

    setGroceries((current) => {
      if (hasEquivalentGroceryEntry(current, cleanName)) {
        return current;
      }

      return [quickGroceryItem(cleanName), ...current];
    });
  };

  const removeGroceryItem = (id: string): void => {
    setGroceries((current) =>
      current.filter((groceryItem) => groceryItem.id !== id)
    );
  };

  // `buyGrocery` is the most sensitive operation because it updates both the grocery list and
  // the ingredient list at once. The state update must be based on the current snapshots to avoid
  // stale-closure problems when the user taps quickly or the list changes between renders.
  const buyGrocery = (id: string): void => {
    setGroceries((currentGroceries) => {
      const groceryItem = currentGroceries.find((item) => item.id === id);

      if (!groceryItem) {
        return currentGroceries;
      }

      setIngredients((currentIngredients) => {
        const boughtIngredient = buildBoughtIngredient(groceryItem, currentIngredients);

        return [{
          ...boughtIngredient,
          isRecent: true,
        }, ...currentIngredients];
      });

      return currentGroceries.filter((item) => item.id !== id);
    });
  };

  const deleteGrocery = (id: string): void => {
    // Removing the grocery entry is enough to mark it as no longer pending.
    // We intentionally do not store a separate boolean on the ingredient; the list itself is
    // the source of truth for whether an ingredient is currently requested in groceries.
    removeGroceryItem(id);
  };

  // This is intentionally a derived selector, not separate state.
  // Keeping it derived prevents stale values and makes the app consistent with the persisted list.
  const activeIngredients = useMemo(() => ingredients, [ingredients]);

  // `lowIngredients` is a derived list from the persisted ingredients and groceries arrays.
  // If an ingredient is already in the grocery list, it is removed from the suggestions.
  const lowIngredients = useMemo(() => {
    const listedIngredientIds = new Set(
      groceries
        .map((item) => item.sourceIngredientId)
        .filter((id): id is string => id !== null)
    );

    return ingredients.filter((ingredient) => {
      const alreadyListedById = listedIngredientIds.has(ingredient.id);

      return !alreadyListedById && isLowOrEmpty(ingredient);
    });
  }, [ingredients, groceries]);

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
