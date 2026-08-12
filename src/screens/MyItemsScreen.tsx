import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChipSelector } from '../components/ChipSelector';
import { Header } from '../components/Header';
import { IngredientList } from '../components/IngredientList';
import { useIngredients } from '../context/AppContext';
import { CATEGORIES, CONFECTIONS, LOCATIONS } from '../constants/options';
import { COLORS, styles } from '../theme/styles';
import { Category, ConfectionType, Ingredient, Location, QueryMode } from '../types';
import { filterIngredients, getMissingDataItems, getRecentlyAdded, filterRecentIngredients } from '../utils/helpers';



type MyItemsStackParamList = {
  MyItemsHome: undefined;
  EditIngredient: { ingredient: Ingredient };
};

type MyItemsScreenProps = NativeStackScreenProps<MyItemsStackParamList, 'MyItemsHome'>;

/**
 * MyItemsScreen is the queries tab where the user can search for ingredient lists
 * by text and by chip-driven filter criteria.
 */
export const MyItemsScreen: React.FC<MyItemsScreenProps> = ({ navigation }) => {
  const { ingredients } = useIngredients();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [queryMode, setQueryMode] = useState<QueryMode>('all');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedConfection, setSelectedConfection] = useState<ConfectionType | null>(null);

  const filteredIngredients = useMemo(() => {
    let result = [...ingredients];

    // 2. handling of the 4 DIFFERENT QUERY MODES
    if (queryMode === 'missing') {
      result = getMissingDataItems(result);
    } else if (queryMode === 'recent_added') {
      result = getRecentlyAdded(result, 5); // 5 last added items
    } else if (queryMode === 'recently_bought') {
      result = filterRecentIngredients(result); // isRecent: true
    }

    return filterIngredients(result, searchTerm, selectedLocation, selectedCategory, selectedConfection);
  }, [ingredients, queryMode, searchTerm, selectedLocation, selectedCategory, selectedConfection]);

  const handlePress = (ingredient: Ingredient): void => {
    navigation.navigate('EditIngredient', { ingredient });
  };

  return (
    <View style={styles.flex1}>
      <Header />
      <ScrollView
        style={styles.flex1}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        
        <TextInput
          style={styles.input}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search for ingredients"
          placeholderTextColor={COLORS.placeholder}
        />

        <View style={styles.queryButtonRow}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setSearchTerm('');
              setQueryMode('all');
              setSelectedLocation(null);
              setSelectedCategory(null);
              setSelectedConfection(null);
            }}
          >
            
          <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>

          {[
            { label: 'All', value: 'all' },
            { label: 'Missing data', value: 'missing' },
            { label: 'Recently Added', value: 'recent_added' },
            { label: 'Recently Bought Groceries', value: 'recently_bought' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.chip, queryMode === option.value && styles.chipSelected]}
              onPress={() => setQueryMode(option.value as QueryMode)}
            >
              <Text style={queryMode === option.value ? styles.chipTextSelected : styles.chipText}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Filter by location</Text>
        <ChipSelector options={LOCATIONS} selectedValue={selectedLocation} onSelect={(value) => setSelectedLocation(value as Location | null)} />

        <Text style={styles.label}>Filter by category</Text>
        <ChipSelector options={CATEGORIES} selectedValue={selectedCategory} onSelect={(value) => setSelectedCategory(value as Category | null)} />

        <Text style={styles.label}>Filter by confection</Text>
        <ChipSelector options={CONFECTIONS} selectedValue={selectedConfection} onSelect={(value) => setSelectedConfection(value as ConfectionType | null)} />

        <Text style={styles.label}>My items</Text>

        <IngredientList ingredients={filteredIngredients} onPress={handlePress} />
      </ScrollView>
    </View>
  );
};
