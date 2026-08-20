import 'react-native-gesture-handler';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './context/AppContext';
import { AppNavigator} from './navigation/AppNavigator';

/**
 * APP ENTRY POINT: wraps navigation with safe-area and app state providers
 */

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
};

export default App;