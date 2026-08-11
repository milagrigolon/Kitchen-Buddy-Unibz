import React from 'react';
import { View, Text } from 'react-native';
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
 * The parent screen owns the page scroll, so the filters and the results move
 * together as a single scrollable page while the component stays focused on UI.
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
    <View>
      {ingredients.map((ingredient) => (
        <IngredientCard
          key={ingredient.id}
          ingredient={ingredient}
          onPress={onPress}
          onDelete={onDelete}
        />
      ))}
    </View>
  );
};
