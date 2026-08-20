import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
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
const ExpiringStack = createStackNavigator<ExpiringStackParamList>();
const MyItemsStack = createStackNavigator<MyItemsStackParamList>();

const ExpiringNavigator: React.FC = () => (
  <ExpiringStack.Navigator>
    <ExpiringStack.Screen name="ExpiringHome" component={ExpiringScreen} options={{ headerShown: false }} />
    <ExpiringStack.Screen name="EditIngredient" component={EditScreen} options={{ headerShown: false }} />
  </ExpiringStack.Navigator>
);

const MyItemsNavigator: React.FC = () => (
  <MyItemsStack.Navigator>
    <MyItemsStack.Screen name="MyItemsHome" component={MyItemsScreen} options={{ headerShown: false }} />
    <MyItemsStack.Screen name="EditIngredient" component={EditScreen} options={{ headerShown: false }} />
  </MyItemsStack.Navigator>
);

interface NavigationRef {
  navigate: (screen: string) => void;
  isReady?: () => boolean;
}

export const AppNavigator: React.FC = () => {
  const { status } = useAppStatus();
  const { nearbyShop } = useNearbyShop();
  
  const navigationRef = useRef<NavigationRef | null>(null);
  const [openedFromShop, setOpenedFromShop] = useState('');

  const setNavigationRef = (ref: unknown): void => {
    const possibleRef = ref as NavigationRef | null;
    navigationRef.current = possibleRef && typeof possibleRef.navigate === 'function'
      ? possibleRef
      : null;
  };

  useEffect(() => {
    const navigation = navigationRef.current;
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