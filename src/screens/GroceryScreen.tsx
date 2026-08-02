import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { GroceryItemCard } from '../components/GroceryItemCard';
import { Header } from '../components/Header';
import { ShopLocationBanner } from '../components/ShopLocationBanner';
import { useAppStatus, useGroceries, useNearbyShop } from '../context/AppContext';
import { styles } from '../theme/styles';
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
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Grocery list</Text>
        <ShopLocationBanner nearbyShop={nearbyShop} />

        <TextInput
          style={styles.input}
          value={quickText}
          onChangeText={setQuickText}
          placeholder="Quick-add grocery item (e.g. Pasta)"
        />

        <TouchableOpacity style={styles.mainButton} onPress={handleQuickAdd}>
          <Text style={styles.buttonText}>Add to groceries</Text>
        </TouchableOpacity>

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
      </View>
    </View>
  );
};
