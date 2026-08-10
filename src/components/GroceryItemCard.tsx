import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { GroceryItem } from '../types';
import { COLORS, styles } from '../theme/styles';

interface GroceryItemCardProps {
  item: GroceryItem;
  onBuy: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * GroceryItemCard shows a single shopping item and the actions to buy or delete it.
 */
export const GroceryItemCard: React.FC<GroceryItemCardProps> = ({ item, onBuy, onDelete }) => (
  <View style={styles.card}>
    <View style={styles.cardRow}>
      <Text style={styles.cardTitle}>{item.name}</Text>
    </View>
    <Text style={styles.cardLoc}>Qty: {item.quantity ?? 1} {item.unit ?? 'pcs'}</Text>

    <View style={styles.groceryCardActionsRow}>
      <TouchableOpacity
        style={styles.groceryBuyButton}
        onPress={() => onBuy(item.id)}
      >
        <Text style={styles.groceryBuyText}>Bought</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.groceryRemoveButton}
        onPress={() => onDelete(item.id)}
      >
        <Text style={styles.groceryRemoveText}>Remove</Text>
      </TouchableOpacity>
    </View>
  </View>
);
