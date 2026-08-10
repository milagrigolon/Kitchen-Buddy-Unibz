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
          <Text style={{ color: '#ef4444', fontWeight: '700' }}>Delete</Text>
        </TouchableOpacity>
      ) : null}
    </View>
    <Text style={styles.cardLoc}>{ingredient.category ?? 'No category'} | {ingredient.location ?? 'No location'}</Text>
    <Text style={styles.cardExp}>Expires: {ingredient.expirationDate ?? 'Not set'}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
      {ingredient.isFrozen ? <Text style={{ backgroundColor: COLORS.primaryLight, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6 }}>FROZEN</Text> : null}
      {ingredient.isOpen ? <Text style={{ backgroundColor: COLORS.primaryLight, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6 }}>OPEN</Text> : null}
      {ingredient.ripeness ? <Text style={{ backgroundColor: COLORS.primaryLight, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6 }}>{ingredient.ripeness.toUpperCase()}</Text> : null}
    </View>
  </TouchableOpacity>
);
