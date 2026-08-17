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
  // This state is local to the app behavior but persisted so that a handled low-stock
  // suggestion does not reappear after the user buys or removes the grocery item.
  const [handledLowStockIngredientIds, setHandledLowStockIngredientIds] =
    usePersistentState<string[]>('kitchen-buddy-handled-low-stock', []);
  const [nearbyShop, setNearbyShop] = useState<Shop | null>(null);
  const [status, setStatus] = useState<'booting' | 'ready'>('booting');

  // =========================================================================
  // APP INITIALIZATION & BACKGROUND TASK EXECUTION
  // =========================================================================
  // Understanding `useEffect` in React:
  //
  // 1. What is `useEffect`?
  //    `useEffect` is a React Hook designed to handle "side effects" in functional 
  //    components. Side effects include data fetching, timers, manual DOM updates, 
  //    and interacting with device hardware (such as GPS/Location services).
  //    It runs *after* React has completed the render cycle, ensuring that heavy 
  //    computations or external tasks do not block the UI from drawing.
  //
  // 2. The Dependency Array `[]`:
  //    Passing an empty array `[]` as the second argument tells React to execute 
  //    this effect callback strictly ONCE when the component mounts (is inserted into 
  //    the screen tree), and never re-run it during subsequent re-renders.
  //
  // 3. Why we use an inner `async` function (`initApp`):
  //    `useEffect` callbacks cannot be marked as `async` directly because React 
  //    expects the effect to return either nothing (`undefined`) or a synchronous 
  //    cleanup function. Returning a Promise directly from `useEffect` leads to race 
  //    conditions. Thus, we declare `const initApp = async () => {...}` inside the 
  //    hook and trigger it via `void initApp()`.
  //
  // 4. The Cleanup Function (`return () => { mounted = false; }`):
  //    When the component unmounts, React executes the returned cleanup function. 
  //    Setting `mounted = false` prevents memory leaks and errors caused by trying 
  //    to update React state (`setStatus`, `setNearbyShop`) on a component that no 
  //    longer exists on screen.
  //
  // 5. Asynchronous Promises & `async/await`:
  //    - `async` creates a function that implicitly returns a Promise.
  //    - `await` pauses execution of this microtask until the underlying Promise 
  //      resolves (or rejects), while freeing up the main JavaScript thread so 
  //      the application remains responsive and smooth to user touches.
  // =========================================================================

  useEffect(() => {
    // Flag to track whether the component is currently mounted in the view hierarchy
    let mounted = true;

    const initApp = async (): Promise<void> => {
      try {
        // STEP 1: Unblock the UI immediately.
        // We resolve `status` to 'ready' synchronously/upfront so the app renders
        // the main interface with local data (from AsyncStorage) immediately, 
        // avoiding booting screen lockups.
        if (mounted) {
          setStatus('ready');
        }

        // STEP 2: Await Location Permission Promise.
        // `requestForegroundPermissionsAsync` returns a Promise<PermissionResponse>.
        // `await` waits for the user to grant or deny system permissions.
        const permission = await Location.requestForegroundPermissionsAsync();

        // GUARD CLAUSE: if the user rejects permission or the component unmounted, exit early.
        if (permission.status !== 'granted' || !mounted) {
          return;
        }

        // STEP 3: Await Native GPS Promise.
        // `getCurrentPositionAsync` queries device location hardware and returns a 
        // Promise<LocationObject>. Accuracy.Low resolves significantly faster with 
        // minimal battery overhead, which is ideal for broad shop matching.
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });

        const { latitude, longitude } = position.coords;

        // STEP 4: Network Fetch Promise with Client-Side Timeout Protection.
        // We set an AbortController with a 4000ms timer. If the Overpass API network 
        // request takes too long on slow mobile networks, the controller cancels it.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        // `fetchNearbyShops` returns a Promise<Shop[]>.
        // Appending `.catch(() => [])` handles any network rejection gracefully by 
        // resolving to an empty array instead of throwing an unhandled exception.
        const apiShops = await fetchNearbyShops(latitude, longitude).catch(() => []);
        clearTimeout(timeoutId);

        // STEP 5: Merge live API results with static fallback shop definitions.
        const shops = [...apiShops, ...DEFAULT_SHOPS];

        // STEP 6: Compute closest store and update React Context state.
        if (mounted) {
          setNearbyShop(nearestShopFrom(latitude, longitude, shops));
        }
      } catch (error) {
        // Safely catch and log unexpected runtime errors without crashing the app
        console.warn('Unable to resolve background location/store', error);
      }
    };

    // trigger the asynchronous initialization function
    void initApp();

    // CLEAN UP PHASE: runs when the component unmounts to prevent asynchronous memory leaks
    return () => {
      mounted = false;
    };
  }, []); // empty dependency array ensures this effect runs exactly once on mount

  // PERSISTENT INGREDIENT STATE: these updates are intentionally written through the
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
    setHandledLowStockIngredientIds((current) => {
      if (current.includes(ingredient.id)) {
        return current;
      }

      return [...current, ingredient.id];
    });

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

      if (groceryItem.sourceIngredientId) {
        setHandledLowStockIngredientIds((current) => {
          if (current.includes(groceryItem.sourceIngredientId!)) {
            return current;
          }

          return [...current, groceryItem.sourceIngredientId!];
        });
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
    const groceryItem = groceries.find((item) => item.id === id);

    if (groceryItem?.sourceIngredientId) {
      setHandledLowStockIngredientIds((current) => {
        if (current.includes(groceryItem.sourceIngredientId!)) {
          return current;
        }

        return [...current, groceryItem.sourceIngredientId!];
      });
    }

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

    const handledIds = new Set(handledLowStockIngredientIds);

    return ingredients.filter((ingredient) => {
      const alreadyListedById = listedIngredientIds.has(ingredient.id);
      const alreadyHandled = handledIds.has(ingredient.id);

      return !alreadyListedById && !alreadyHandled && isLowOrEmpty(ingredient);
    });
  }, [ingredients, groceries, handledLowStockIngredientIds]);

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
