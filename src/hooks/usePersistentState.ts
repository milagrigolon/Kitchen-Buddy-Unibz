import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * usePersistentState is a custom React hook that provides a way to manage state 
 * that persists across app restarts using AsyncStorage.
 */
export const usePersistentState = <T,>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] => {

  const [state, setState] = useState<T>(initialValue);

  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const loadState = async (): Promise<void> => {
      try {
        const storedValue = await AsyncStorage.getItem(key);

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
