import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ingredient } from '../types';
import { COLORS, styles } from '../theme/styles';

interface IngredientCardProps {
  ingredient: Ingredient;
  onPress: (ingredient: Ingredient) => void;
  onDelete?: (id: string) => void;
}

/**
 * IngredientCard renders one ingredient as a tappable list card with status badges.
 */
export const IngredientCard: React.FC<IngredientCardProps> = ({ ingredient, onPress, onDelete }) => (
  <TouchableOpacity style={styles.card} onPress={() => onPress(ingredient)} activeOpacity={0.9}>
    <View style={styles.cardRow}>
      <Text style={styles.cardTitle}>{ingredient.name}</Text>
      {onDelete ? (
        <TouchableOpacity onPress={() => onDelete(ingredient.id)}>
          <Text style={styles.ingredientDeleteText}>Delete</Text>
        </TouchableOpacity>
      ) : null}
    </View>
    <Text style={styles.cardLoc}>{ingredient.category ?? 'No category'} | {ingredient.location ?? 'No location'}</Text>
    <Text style={styles.cardExp}>Expires: {ingredient.expirationDate ?? 'Not set'}</Text>
    <View style={styles.ingredientStatusRow}>
      {ingredient.isFrozen ? <Text style={styles.ingredientStatusTag}>FROZEN</Text> : null}
      {ingredient.isOpen ? <Text style={styles.ingredientStatusTag}>OPEN</Text> : null}
      {ingredient.ripeness ? <Text style={styles.ingredientStatusTag}>{ingredient.ripeness.toUpperCase()}</Text> : null}
    </View>
  </TouchableOpacity>
);
