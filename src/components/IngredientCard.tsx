import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ingredient } from '../types';
import { styles } from '../theme/styles';

interface IngredientCardProps {
  ingredient: Ingredient;
  onPress: (ingredient: Ingredient) => void;
}

/**
 * IngredientCard renders one ingredient as a tappable list card with status badges
 * and a presentational alert badge if key details (category, location, expiration) are missing.
 */
export const IngredientCard: React.FC<IngredientCardProps> = ({ ingredient, onPress }) => {
  // Verifica puramente visuale dei dettagli mancanti
  const hasMissingDetails =
    !ingredient.category ||
    !ingredient.location ||
    !ingredient.expirationDate ||
    ingredient.expirationDate.trim() === '';

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(ingredient)} activeOpacity={0.9}>
      <View style={styles.cardRow}>
        <Text style={styles.cardTitle}>{ingredient.name}</Text>

        {/* Presentational Badge per Missing Details */}
        {hasMissingDetails && (
          <View style={styles.missingDetailsBadge}>
            <Text style={styles.missingDetailsText}>Missing Details</Text>
          </View>
        )}
      </View>

      <Text style={styles.cardLoc}>
        {ingredient.category ?? 'No category'} | {ingredient.location ?? 'No location'}
      </Text>
      <Text style={styles.cardExp}>
        Expires: {ingredient.expirationDate && ingredient.expirationDate.trim() !== '' ? ingredient.expirationDate : 'Not set'}
      </Text>

      <View style={styles.ingredientStatusRow}>
        {ingredient.isFrozen ? <Text style={styles.ingredientStatusTag}>FROZEN</Text> : null}
        {ingredient.isOpen ? <Text style={styles.ingredientStatusTag}>OPEN</Text> : null}
        {ingredient.ripeness ? <Text style={styles.ingredientStatusTag}>{ingredient.ripeness.toUpperCase()}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};