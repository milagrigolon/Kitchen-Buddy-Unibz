import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * This hook keeps a local React state value synchronized with AsyncStorage.
 *
 * Rule of the app:
 * - React state is the live, in-memory source of truth while the screen is active.
 * - AsyncStorage is the durable source that restores the app after reload.
 * - We intentionally delay the first persist until the stored data is loaded to avoid
 *   overwriting a freshly restored value with the default initial state.
 */
export const usePersistentState = <T,>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] => {
  // Local in-memory mirror. This is what the UI reads and updates.
  const [state, setState] = useState<T>(initialValue);

  // Tracks whether async hydration has finished.
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const loadState = async (): Promise<void> => {
      try {
        const storedValue = await AsyncStorage.getItem(key);

        // Hydration is intentionally applied only after the storage read succeeds.
        // This prevents the "default state wins over persisted state" race.
        if (isMounted && storedValue) {
          setState(JSON.parse(storedValue) as T);
        }
      } catch (error) {
        console.warn(`Unable to load persistent state for ${key}`, error);
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    };

    void loadState();

    return () => {
      isMounted = false;
    };
  }, [key]);

  useEffect(() => {
    // Avoid persisting the initial placeholder before the stored data is restored.
    if (!isLoaded) {
      return;
    }

    const persistState = async (): Promise<void> => {
      try {
        await AsyncStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.warn(`Unable to persist state for ${key}`, error);
      }
    };

    void persistState();
  }, [isLoaded, key, state]);

  return [state, setState];
};
