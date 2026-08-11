import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native'; // 1. Aggiunto ScrollView
import { GroceryItemCard } from '../components/GroceryItemCard';
import { Header } from '../components/Header';
import { ShopLocationBanner } from '../components/ShopLocationBanner';
import { useAppStatus, useGroceries, useNearbyShop } from '../context/AppContext';
import { COLORS, styles } from '../theme/styles';
import { GroceryItem } from '../types';

/**
 * GroceryScreen manages the grocery list panel.
 * It exposes quick-add, low-stock suggestions, and purchase flow for the pair-project extension.
 */
export const GroceryScreen: React.FC = () => {
  const { groceries, quickAddGrocery, buyGrocery, deleteGrocery } = useGroceries();
  const { lowIngredients } = useAppStatus();
  const { nearbyShop } = useNearbyShop();
  const [quickText, setQuickText] = useState<string>('');

  const sortedGroceries = useMemo(
    () => [...groceries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [groceries]
  );

  const handleQuickAdd = (): void => {
    quickAddGrocery(quickText);
    setQuickText('');
  };

  const handleBuy = (id: string): void => {
    buyGrocery(id);
    Alert.alert('Purchase confirmed', 'The grocery item was removed from the list.');
  };

  return (
    <View style={styles.flex1}>
      <Header />
      {/* Scrollview to enable scrolling */}
      <ScrollView 
        style={styles.flex1} 
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        
        <ShopLocationBanner nearbyShop={nearbyShop} />

        <Text style={styles.label}>Quick add grocery item (e.g. Pasta)</Text>

        {/* horizontal container inline */}
        <View style={styles.quickAddRow}>
          <TextInput
            style={[styles.input, styles.quickAddInput]}
            value={quickText}
            onChangeText={setQuickText}
            placeholder="Grocery item name"
            placeholderTextColor={COLORS.placeholder}
          />

          <TouchableOpacity style={styles.quickAddButton} onPress={handleQuickAdd}>
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Low-stock suggestions</Text>
        {lowIngredients.length === 0 ? (
          <Text style={styles.emptyText}>No low-stock suggestions right now.</Text>
        ) : (
          lowIngredients.map((ingredient) => (
            <TouchableOpacity key={ingredient.id} style={styles.card} onPress={() => quickAddGrocery(ingredient.name)}>
              <Text style={styles.cardTitle}>{ingredient.name}</Text>
              <Text style={styles.cardLoc}>Add to groceries</Text>
            </TouchableOpacity>
          ))
        )}

        <Text style={styles.label}>Shopping list</Text>
        {sortedGroceries.length === 0 ? (
          <Text style={styles.emptyText}>The grocery list is empty.</Text>
        ) : (
          sortedGroceries.map((item: GroceryItem) => (
            <GroceryItemCard key={item.id} item={item} onBuy={handleBuy} onDelete={deleteGrocery} />
          ))
        )}
      </ScrollView>
    </View>
  );
};