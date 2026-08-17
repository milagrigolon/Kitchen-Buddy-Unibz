import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  ListRenderItem,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { GroceryItemCard } from '../components/GroceryItemCard';
import { Header } from '../components/Header';
import { ShopLocationBanner } from '../components/ShopLocationBanner';
import { useAppStatus, useGroceries, useNearbyShop } from '../context/AppContext';
import { COLORS, styles } from '../theme/styles';
import { GroceryItem } from '../types';
import { nearbyStoreSuggestions, sortGroceriesForShop } from '../utils/helpers';

export const GroceryScreen: React.FC = () => {
  const {
    groceries,
    addGroceryFromIngredient,
    quickAddGrocery,
    buyGrocery,
    deleteGrocery,
  } = useGroceries();

  const { lowIngredients } = useAppStatus();
  const { nearbyShop } = useNearbyShop();
  const { width } = useWindowDimensions();
  const [quickText, setQuickText] = useState<string>('');
  const numColumns = width >= 760 ? 2 : 1;

  const sortedGroceries = useMemo(
    () => sortGroceriesForShop(groceries, nearbyShop),
    [groceries, nearbyShop]
  );
  const storeSuggestions = useMemo(
    () => nearbyStoreSuggestions(nearbyShop),
    [nearbyShop]
  );

  const addQuickItem = (): void => {
    quickAddGrocery(quickText);
    setQuickText('');
  };

  const buyItem = (id: string): void => {
    buyGrocery(id);
    Alert.alert('Purchase confirmed', 'The grocery item was removed from the list.');
  };

  const renderGroceryItem: ListRenderItem<GroceryItem> = ({ item }) => {
    return (
      <View style={{ flex: 1 / numColumns }}>
        <GroceryItemCard
          item={item}
          onBuy={buyItem}
          onDelete={deleteGrocery}
        />
      </View>
    );
  };

  return (
    <View style={styles.flex1}>
      <Header />

      <FlatList
        key={`groceries-${numColumns}`}
        data={sortedGroceries}
        numColumns={numColumns}
        renderItem={renderGroceryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.flatListContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <ShopLocationBanner nearbyShop={nearbyShop} />

            {storeSuggestions.length > 0 ? (
              <>
                <Text style={styles.label}>Nearby store suggestions</Text>

                <View style={styles.queryButtonRow}>
                  {storeSuggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion}
                      style={styles.chip}
                      onPress={() => quickAddGrocery(suggestion)}
                    >
                      <Text style={styles.chipText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : null}

            <Text style={styles.label}>Quick add grocery item (e.g. Pasta)</Text>

            <View style={styles.quickAddRow}>
              <TextInput
                style={[styles.input, styles.quickAddInput]}
                value={quickText}
                onChangeText={setQuickText}
                placeholder="Grocery item name"
                placeholderTextColor={COLORS.placeholder}
              />

              <TouchableOpacity
                style={styles.quickAddButton}
                onPress={addQuickItem}
              >
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Low-stock suggestions</Text>

            {lowIngredients.length === 0 ? (
              <Text style={styles.emptyText}>
                No low-stock suggestions right now.
              </Text>
            ) : (
              lowIngredients.map((ingredient) => (
                <TouchableOpacity
                  key={ingredient.id}
                  style={styles.card}
                  onPress={() => addGroceryFromIngredient(ingredient)}
                >
                  <Text style={styles.cardTitle}>{ingredient.name}</Text>
                  <Text style={styles.cardLoc}>Add to groceries</Text>
                </TouchableOpacity>
              ))
            )}

            <Text style={styles.label}>Shopping list</Text>

          </>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>The grocery list is empty.</Text>
        }
      />
    </View>
  );
};
