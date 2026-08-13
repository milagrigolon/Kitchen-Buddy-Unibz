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
    <TouchableOpacity
      style={[
        styles.card,
        ingredient.isFrozen ? styles.frozenCard : null
      ]}
      onPress={() => onPress(ingredient)}
      activeOpacity={0.9}
    >
      {/* 1. NAME */}
      <View style={styles.cardRow}>
        <Text style={styles.cardTitle}>{ingredient.name}</Text>
      </View>

      {/* 2. CATEGORY AND POSITION*/}
      <Text style={styles.cardLoc}>
        {ingredient.category ?? 'No category'} | {ingredient.location ?? 'No location'}
      </Text>

      {/* 3. EXP DATE */}
      <Text style={styles.cardExp}>
        Expires: {ingredient.expirationDate && ingredient.expirationDate.trim() !== '' ? ingredient.expirationDate : 'Not set'}
      </Text>

      {/* 4. Frozen / Open tag*/}
      <View style={styles.cardFooterRow}>
        <View style={styles.ingredientStatusRow}>
          {ingredient.isFrozen ? <Text style={styles.ingredientStatusTag}>FROZEN</Text> : null}
          {ingredient.isOpen ? <Text style={styles.ingredientStatusTag}>OPEN</Text> : null}
          {ingredient.ripeness ? <Text style={styles.ingredientStatusTag}>{ingredient.ripeness.toUpperCase()}</Text> : null}
        </View>

        {/* BADGE to be positioned bottom right*/}
        {hasMissingDetails && (
          <View style={styles.missingDetailsBadge}>
            <Text style={styles.missingDetailsText}>Missing details</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};