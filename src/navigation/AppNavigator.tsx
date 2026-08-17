import React, { useEffect, useRef } from 'react';
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

/**
 * AppNavigator is the CENTRAL ROUTING LAYER
 * It shows an initial loading indicator while the app bootstraps, and then
 * exposes the bottom-tab flow.
 */
export const AppNavigator: React.FC = () => {
  const { status } = useAppStatus();
  const { nearbyShop } = useNearbyShop();
  
  // Navigation reference to control routing imperatively from effects
  const navigationRef = useRef<any>(null);
  const hasRedirectedRef = useRef<boolean>(false);

  // =========================================================================
  // AUTOMATIC ROUTE SWITCH WHEN NEARBY STORE IS DETECTED
  // =========================================================================
  // When shop detection completes asynchronously in the background, this effect
  // triggers a navigation transition to the 'Groceries' tab if a store is found,
  // ensuring the feature works seamlessly even with instant app launch.

  useEffect(() => {
    if (nearbyShop && navigationRef.current && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      navigationRef.current.navigate('Groceries');
    }
  }, [nearbyShop]);

  if (status === 'booting') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
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