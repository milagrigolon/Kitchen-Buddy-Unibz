// Main application shell for Kitchen Buddy.
// This file owns the top-level navigation tabs, the list-query state, 
// and the modal-based edit flow shown above the ingredient list.

import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, TextInput, Alert, ScrollView, Modal } from 'react-native';
import { AppProvider, useAppContext } from './src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { IngredientForm } from './src/components/IngredientForm';
import { ExpiringList } from './src/components/ExpiringList';
import { ChipSelector } from './src/components/ChipSelector';
import { styles, COLORS } from './src/theme/styles';
import { Category, ConfectionType, Ingredient, Location } from './src/types';
import { CATEGORIES, CONFECTIONS, LOCATIONS } from './src/utils/constants';
import {
  filterIngredients,
  getMissingDataItems,
  getRecentlyAdded,
} from './src/utils/helpers';

type TabKey = 'add' | 'expiring' | 'list';
type ListQuery = 'all' | 'missing' | 'recent';

// MainScreen is the screen container that decides which workflow is active
// at any moment: add a new ingredient, browse expiring ingredients, or query
// the full ingredient list with search and filters.
const MainScreen: React.FC = () => {
  const { ingredients, handleAdd, handleUpdate } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabKey>('add');
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [queryMode, setQueryMode] = useState<ListQuery>('all');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedConfection, setSelectedConfection] = useState<ConfectionType | null>(null);

  // filteredIngredients is the derived query result shown in the List tab.
  // It combines the raw ingredient collection with the current search text
  // and the active chips for location, category, and confection.
  const filteredIngredients = useMemo(() => {
    let result = [...ingredients];

    if (queryMode === 'missing') {
      result = getMissingDataItems(result);
    } else if (queryMode === 'recent') {
      result = getRecentlyAdded(result);
    }

    return filterIngredients(
      result,
      searchTerm,
      selectedLocation,
      selectedCategory,
      selectedConfection
    );
  }, [ingredients, queryMode, searchTerm, selectedLocation, selectedCategory, selectedConfection]);

  // clearListFilters resets the list browser back to its neutral state.
  const clearListFilters = (): void => {
    setSearchTerm('');
    setQueryMode('all');
    setSelectedLocation(null);
    setSelectedCategory(null);
    setSelectedConfection(null);
  };

  // handleIngredientPress opens the edit flow for a selected item.
  // If the ingredient is incomplete, the user receives a small warning message
  // before entering the editor.
  const handleIngredientPress = (item: Ingredient): void => {
    if (!item.category || !item.location || !item.confectionType || !item.expirationDate) {
      Alert.alert(
        'Incomplete ingredient',
        'Some fields are missing. You can complete them from the edit form.'
      );
    }

    setEditingIngredient(item);
  };

  // renderContent is the tab switcher. It decides which screen is shown
  // depending on the selected navigation tab.
  const renderContent = (): React.ReactNode => {
    switch (activeTab) {
      case 'add':
        return <IngredientForm onSave={handleAdd} isEdit={false} />;
      case 'expiring':
        return <ExpiringList ingredients={ingredients} />;
      case 'list':
        return (
          <ScrollView
            style={styles.formPadding}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.sectionTitle}>Your ingredients ({filteredIngredients.length})</Text>

            <TextInput
              style={styles.input}
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search ingredients..."
            />

            <View style={styles.queryButtonRow}>
              <TouchableOpacity style={styles.clearButton} onPress={clearListFilters}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>

              {[
                { label: 'All items', value: 'all' },
                { label: 'Missing data', value: 'missing' },
                { label: 'Recent', value: 'recent' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.chip, queryMode === option.value && styles.chipSelected]}
                  onPress={() => setQueryMode(option.value as ListQuery)}
                >
                  <Text style={queryMode === option.value ? styles.chipTextSelected : styles.chipText}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Filter by location</Text>
            <ChipSelector
              options={LOCATIONS}
              selectedValue={selectedLocation}
              onSelect={(value) => setSelectedLocation(value as Location | null)}
            />

            <Text style={styles.label}>Filter by category</Text>
            <ChipSelector
              options={CATEGORIES}
              selectedValue={selectedCategory}
              onSelect={(value) => setSelectedCategory(value as Category | null)}
            />

            <Text style={styles.label}>Filter by confection</Text>
            <ChipSelector
              options={CONFECTIONS}
              selectedValue={selectedConfection}
              onSelect={(value) => setSelectedConfection(value as ConfectionType | null)}
            />

            {filteredIngredients.length === 0 ? (
              <Text style={styles.emptyText}>No ingredients match the current query.</Text>
            ) : (
              filteredIngredients.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => handleIngredientPress(item)}
                >
                  <View style={styles.card}>
                    <View style={styles.cardRow}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                    </View>
                    <Text style={styles.cardLoc}>
                      {item.category || 'No category'} | {item.location || 'No location'}
                    </Text>
                    <Text style={styles.cardExp}>
                      Expiration date: {item.expirationDate || 'Not set'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}

          </ScrollView>
        );
    }
  };

  return (
    <SafeAreaView style={styles.flex1}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Kitchen Buddy</Text>
      </View>

      {/* Content for the active tab */}
      <View style={{ flex: 1 }}>{renderContent()}</View>

      {/* Modal overlay for editing an ingredient.
          The list remains visible underneath while the form opens above it.
          This keeps the browsing workflow intact and makes the editor feel like
          a separate focused screen instead of an inline panel. */}
      <Modal
        visible={!!editingIngredient}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setEditingIngredient(null)}
      >
        <SafeAreaView style={styles.flex1}>
          <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <Text style={styles.sectionTitle}>Edit ingredient</Text>
            <IngredientForm
              initialData={editingIngredient}
              onSave={(updatedIngredient) => {
                handleUpdate(updatedIngredient);
                setEditingIngredient(null);
              }}
              isEdit={true}
              onCancel={() => setEditingIngredient(null)}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* TAB BAR */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'add' && styles.tabActive]}
          onPress={() => {
            setActiveTab('add');
            setEditingIngredient(null);
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'add' ? 'add-circle' : 'add-circle-outline'}
            size={20}
            color={activeTab === 'add' ? COLORS.primary : COLORS.textMuted}
            style={{ marginRight: 4 }}
          />
          <Text style={activeTab === 'add' ? styles.tabTextActive : styles.tabText}>
            Add
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'expiring' && styles.tabActive]}
          onPress={() => {
            setActiveTab('expiring');
            setEditingIngredient(null);
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'expiring' ? 'time' : 'time-outline'}
            size={20}
            color={activeTab === 'expiring' ? COLORS.primary : COLORS.textMuted}
            style={{ marginRight: 4 }}
          />
          <Text style={activeTab === 'expiring' ? styles.tabTextActive : styles.tabText}>
            Expiring
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'list' && styles.tabActive]}
          onPress={() => {
            setActiveTab('list');
            setEditingIngredient(null);
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'list' ? 'list-sharp' : 'list-outline'}
            size={20}
            color={activeTab === 'list' ? COLORS.primary : COLORS.textMuted}
            style={{ marginRight: 4 }}
          />
          <Text style={activeTab === 'list' ? styles.tabTextActive : styles.tabText}>
            List ({ingredients.length})
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default function App(): React.ReactElement {
  return (
    <AppProvider>
      <MainScreen />
    </AppProvider>
  );
}