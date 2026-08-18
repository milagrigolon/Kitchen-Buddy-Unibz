import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AddScreen } from '../screens/AddScreen';
import { ExpiringScreen } from '../screens/ExpiringScreen';
import { MyItemsScreen } from '../screens/MyItemsScreen';
import { GroceryScreen } from '../screens/GroceryScreen';
import { EditScreen } from '../screens/EditScreen';
import { useAppStatus, useNearbyShop } from '../context/AppContext';
import { COLORS, styles } from '../theme/styles';
import { Ingredient } from '../types';

type ExpiringStackParamList = {
  ExpiringHome: undefined;
  EditIngredient: { ingredient: Ingredient };
};

type MyItemsStackParamList = {
  MyItemsHome: undefined;
  EditIngredient: { ingredient: Ingredient };
};

const Tab = createBottomTabNavigator();
const ExpiringStack = createNativeStackNavigator<ExpiringStackParamList>();
const MyItemsStack = createNativeStackNavigator<MyItemsStackParamList>();

/**
 * STACK BASED NAVIGATION for EDITING INGREDIENTS
 */
/**
 * ExpiringNavigator wraps the expiring flow with a screen stack so the user can
 * navigate from the list into the edit form when an ingredient is selected.
 */
const ExpiringNavigator: React.FC = () => (
  <ExpiringStack.Navigator>
    <ExpiringStack.Screen name="ExpiringHome" component={ExpiringScreen} options={{ headerShown: false }} />
    <ExpiringStack.Screen name="EditIngredient" component={EditScreen} options={{ headerShown: false }} />
  </ExpiringStack.Navigator>
);

/**
 * MyItemsNavigator does the same for the queries tab.
 */
const MyItemsNavigator: React.FC = () => (
  <MyItemsStack.Navigator>
    <MyItemsStack.Screen name="MyItemsHome" component={MyItemsScreen} options={{ headerShown: false }} />
    <MyItemsStack.Screen name="EditIngredient" component={EditScreen} options={{ headerShown: false }} />
  </MyItemsStack.Navigator>
);

// Narrow interface exposing only the navigation methods we actually use,
// instead of typing navigationRef as `any` (which disables type checking).
interface NavigationRef {
  navigate: (screen: string) => void;
  isReady?: () => boolean;
}

/**
 * AppNavigator is the CENTRAL ROUTING LAYER
 * It shows an initial loading indicator while the app bootstraps, and then
 * exposes the bottom-tab flow.
 */
export const AppNavigator: React.FC = () => {
  const { status } = useAppStatus();
  const { nearbyShop } = useNearbyShop();
  
  // Navigation reference to control routing imperatively from effects
  const navigationRef = useRef<NavigationRef | null>(null);
  // Tracks which shop we last auto-redirected for, instead of a plain boolean —
  // this lets the redirect fire again if the user moves to a DIFFERENT shop,
  // rather than blocking the redirect forever after the first time.
  const [openedFromShop, setOpenedFromShop] = useState('');

// NavigationContainer expects a ref exposing its full API; we only need
// `navigate` and `isReady`, so we validate and narrow it down here instead
// of typing navigationRef with the full (and more complex) library type.
const setNavigationRef = (ref: unknown): void => {
  const possibleRef = ref as NavigationRef | null;
  navigationRef.current = possibleRef && typeof possibleRef.navigate === 'function'
    ? possibleRef
    : null;
};

  // =========================================================================
  // AUTOMATIC ROUTE SWITCH WHEN NEARBY STORE IS DETECTED
  // =========================================================================
  // When shop detection completes asynchronously in the background, this effect
  // triggers a navigation transition to the 'Groceries' tab if a store is found,
  // ensuring the feature works seamlessly even with instant app launch.

useEffect(() => {
  const navigation = navigationRef.current;
  // isReady may not exist on every navigation ref implementation, so we
  // fall back to just checking that the ref itself is set.
  const isReady = navigation?.isReady ? navigation.isReady() : Boolean(navigation);

  if (nearbyShop && openedFromShop !== nearbyShop.id && navigation && isReady) {
    setOpenedFromShop(nearbyShop.id);
    navigation.navigate('Groceries');
  }
}, [nearbyShop, openedFromShop]);

  if (status === 'booting') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={setNavigationRef}>
      <Tab.Navigator
        initialRouteName="Add"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabBarItem,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'add-circle-outline';

            if (route.name === 'Add') {
              iconName = focused ? 'add-circle' : 'add-circle-outline';
            } else if (route.name === 'Expiring') {
              iconName = focused ? 'time' : 'time-outline';
            } else if (route.name === 'My Items') {
              iconName = focused ? 'list' : 'list-outline';
            } else if (route.name === 'Groceries') {
              iconName = focused ? 'cart' : 'cart-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Add" component={AddScreen} />
        <Tab.Screen name="Expiring" component={ExpiringNavigator} />
        <Tab.Screen name="My Items" component={MyItemsNavigator} />
        <Tab.Screen name="Groceries" component={GroceryScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};