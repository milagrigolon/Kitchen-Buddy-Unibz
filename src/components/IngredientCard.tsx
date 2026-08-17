// Small card used by My Items and Expiring lists.

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ingredient } from '../types';
import { styles } from '../theme/styles';
import { needsRipenessCheck, hasMissingDetails } from '../utils/helpers';

interface IngredientCardProps {
  ingredient: Ingredient;
  onPress: (ingredient: Ingredient) => void;
}

const expirationText = (ingredient: Ingredient): string => {
  if (!ingredient.expirationDate || ingredient.expirationDate.trim() === '') {
    return 'Expires: Not set';
  }

  return `Expires: ${ingredient.expirationDate}`;
};

const statusTags = (ingredient: Ingredient): string[] => {
  return [
    ingredient.isFrozen ? 'FROZEN' : '',
    ingredient.isOpen ? 'OPEN' : '',
    ingredient.ripeness ? ingredient.ripeness.toUpperCase() : '',
  ].filter(Boolean);
};

export const IngredientCard: React.FC<IngredientCardProps> = ({
  ingredient,
  onPress,
}) => {
  const missingDetails = hasMissingDetails(ingredient);
  const shouldCheckRipeness = needsRipenessCheck(ingredient);
  const warningText = missingDetails ? 'Missing details' : 'Check ripeness';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        ingredient.isFrozen ? styles.frozenCard : null
      ]}
      onPress={() => onPress(ingredient)}
      activeOpacity={0.9}
    >
      <View style={styles.cardRow}>
        <Text style={styles.cardTitle}>{ingredient.name}</Text>
      </View>

      {ingredient.brand ? (
        <Text style={styles.cardLoc}>Brand: {ingredient.brand}</Text>
      ) : null}

      <Text style={styles.cardLoc}>
        {ingredient.category ?? 'No category'} | {ingredient.location ?? 'No location'}
      </Text>

      <Text style={styles.cardExp}>{expirationText(ingredient)}</Text>

      <View style={styles.cardFooterRow}>
        <View style={styles.ingredientStatusRow}>
          {statusTags(ingredient).map((tag) => (
            <Text key={tag} style={styles.ingredientStatusTag}>
              {tag}
            </Text>
          ))}
        </View>

      <View style={styles.badgesColumn}>
        {/* 1. BADGE RIPENESS*/}
        {shouldCheckRipeness && (
          <View style={styles.ripenessBadge}>
            <Text style={styles.ripenessText}>Check ripeness</Text>
          </View>
        )}

        {/* 2. BADGE MISSING DETAILS*/}
        {missingDetails && (
          <View style={styles.missingDetailsBadge}>
            <Text style={styles.missingDetailsText}>Missing details</Text>
          </View>
        )}
      </View>

      </View>
    </TouchableOpacity>
  );
};
