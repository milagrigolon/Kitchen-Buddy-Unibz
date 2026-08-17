import React, { useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChipSelector } from '../components/ChipSelector';
import { Header } from '../components/Header';
import { IngredientList } from '../components/IngredientList';
import { CATEGORIES, CONFECTIONS, LOCATIONS, QUERY_OPTIONS } from '../constants/options';
import { useIngredients } from '../context/AppContext';
import { COLORS, styles } from '../theme/styles';
import { Category, ConfectionType, Ingredient, Location, QueryMode } from '../types';
import { filterIngredients, filterRecentlyBoughtIngredients, getRecentlyAdded } from '../utils/helpers';

type MyItemsStackParamList = {
  MyItemsHome: undefined;
  EditIngredient: { ingredient: Ingredient };
};

type MyItemsScreenProps =
  NativeStackScreenProps<MyItemsStackParamList, 'MyItemsHome'>;

const applyQueryMode = (
  ingredients: Ingredient[],
  queryMode: QueryMode
): Ingredient[] => {

  if (queryMode === 'recent_added') {
    return getRecentlyAdded(ingredients, 5);
  }

  if (queryMode === 'recently_bought') {
    return filterRecentlyBoughtIngredients(ingredients);
  }

  return ingredients;
};

export const MyItemsScreen: React.FC<MyItemsScreenProps> = ({ navigation }) => {
  const { ingredients } = useIngredients();
  const { width } = useWindowDimensions();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [queryMode, setQueryMode] = useState<QueryMode>('all');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedConfection, setSelectedConfection] =
    useState<ConfectionType | null>(null);
  const numColumns = width >= 760 ? 2 : 1;

  const filteredIngredients = useMemo(() => {
    const queryResult = applyQueryMode(ingredients, queryMode);

    return filterIngredients(
      queryResult,
      searchTerm,
      selectedLocation,
      selectedCategory,
      selectedConfection
    );
  }, [
    ingredients,
    queryMode,
    searchTerm,
    selectedLocation,
    selectedCategory,
    selectedConfection,
  ]);

  const clearFilters = (): void => {
    setSearchTerm('');
    setQueryMode('all');
    setSelectedLocation(null);
    setSelectedCategory(null);
    setSelectedConfection(null);
  };

  const openIngredient = (ingredient: Ingredient): void => {
    navigation.navigate('EditIngredient', { ingredient });
  };

  return (
    <View style={styles.flex1}>
      <Header />

      <IngredientList
        ingredients={filteredIngredients}
        onPress={openIngredient}
        numColumns={numColumns}
        header={
          <>
            <TextInput
              style={styles.input}
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search for ingredients"
              placeholderTextColor={COLORS.placeholder}
            />

            <View style={styles.queryButtonRow}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>

              {QUERY_OPTIONS.map((option) => {
                const selected = queryMode === option.value;

                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setQueryMode(option.value)}
                  >
                    <Text
                      style={selected ? styles.chipTextSelected : styles.chipText}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Filter by location</Text>
            <ChipSelector
              options={LOCATIONS}
              selectedValue={selectedLocation}
              onSelect={setSelectedLocation}
            />

            <Text style={styles.label}>Filter by category</Text>
            <ChipSelector
              options={CATEGORIES}
              selectedValue={selectedCategory}
              onSelect={setSelectedCategory}
            />

            <Text style={styles.label}>Filter by confection</Text>
            <ChipSelector
              options={CONFECTIONS}
              selectedValue={selectedConfection}
              onSelect={setSelectedConfection}
            />

            <Text style={styles.label}>My items</Text>
          </>
        }
      />
    </View>
  );
};
