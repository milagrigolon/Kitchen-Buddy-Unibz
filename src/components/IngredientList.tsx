import React from 'react';
import { FlatList, View, Text } from 'react-native';
import { Ingredient } from '../types';
import { styles } from '../theme/styles';
import { IngredientCard } from './IngredientCard';

interface IngredientListProps {
  ingredients: Ingredient[];
  onPress: (ingredient: Ingredient) => void;
  onDelete?: (id: string) => void;
}

/**
 * IngredientList is a reusable rendering container for ingredient collections.
 */
export const IngredientList: React.FC<IngredientListProps> = ({ ingredients, onPress, onDelete }) => {
  if (ingredients.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No ingredients match the current query.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={ingredients}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 40 }}
      renderItem={({ item }) => (
        <IngredientCard ingredient={item} onPress={onPress} onDelete={onDelete} />
      )}
    />
  );
};
