import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
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

  if (status === 'booting') {
    return (
      <View style={[styles.flex1, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  /** TAB BASED NAVIGATION for the 4 main screens: 
  * - Add
  * - Expiring
  * - My Items
  * - Groceries
   */

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName={nearbyShop ? 'Groceries' : 'Add'}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            height: 76,
            backgroundColor: '#ffffff',
            borderTopWidth: 0,
            borderRadius: 26,
            marginHorizontal: 14,
            marginBottom: 10,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.10,
            shadowRadius: 14,
            elevation: 8,
            paddingTop: 8,
            paddingBottom: 10,
          },
          tabBarItemStyle: {
            borderRadius: 18,
            marginHorizontal: 4,
            height: 54,
          },
          tabBarLabelStyle: {
            fontWeight: '600',
            fontSize: 11,
            marginTop: 2,
          },

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
