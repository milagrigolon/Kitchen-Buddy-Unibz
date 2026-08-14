import React from 'react';
import { FlatList, ListRenderItem, Text, View } from 'react-native';
import { Ingredient } from '../types';
import { styles } from '../theme/styles';
import { IngredientCard } from './IngredientCard';

interface IngredientListProps {
  ingredients: Ingredient[];
  onPress: (ingredient: Ingredient) => void;
  header?: React.ReactElement;
  numColumns?: number;
}

export const IngredientList: React.FC<IngredientListProps> = ({
  ingredients,
  onPress,
  header,
  numColumns = 1,
}) => {
  const renderIngredient: ListRenderItem<Ingredient> = ({ item }) => {
    return (
      <View style={{ flex: 1 / numColumns }}>
        <IngredientCard ingredient={item} onPress={onPress} />
      </View>
    );
  };

  return (
    <FlatList
      key={`ingredients-${numColumns}`}
      data={ingredients}
      numColumns={numColumns}
      renderItem={renderIngredient}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No ingredients match the current query.
          </Text>
        </View>
      }
      contentContainerStyle={styles.flatListContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    />
  );
};
