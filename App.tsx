// Root application entry point for Kitchen Buddy.
// This file is intentionally thin and only boots the safe-area provider,
// the shared AppProvider, and the navigation container.

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import { AppNavigator } from './src/navigation';

const App: React.FC = () => (
  <SafeAreaProvider>
    <AppProvider>
      <AppNavigator />
    </AppProvider>
  </SafeAreaProvider>
);

export default App;