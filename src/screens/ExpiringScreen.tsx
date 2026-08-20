import React, { useMemo, useState } from 'react';
import { TextInput, useWindowDimensions, View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { DaysThresholdControl } from '../components/DaysThresholdControl';
import { Header } from '../components/Header';
import { IngredientList } from '../components/IngredientList';
import { useIngredients } from '../context/AppContext';
import { COLORS, styles } from '../theme/styles';
import { Ingredient } from '../types';
import { filterExpiringWithin } from '../utils/helpers';

type ExpiringStackParamList = {
  ExpiringHome: undefined;
  EditIngredient: { ingredient: Ingredient };
};

type ExpiringScreenProps = StackScreenProps<ExpiringStackParamList, 'ExpiringHome'>;

/**
 * ExpiringScreen shows ingredients that are nearing their expiration date,
 * filtered by days threshold and search text.
 */
export const ExpiringScreen: React.FC<ExpiringScreenProps> = ({ navigation }) => {
  const { ingredients } = useIngredients();
  const { width } = useWindowDimensions();
  const [daysThreshold, setDaysThreshold] = useState<number>(7);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const numColumns = width >= 760 ? 2 : 1;

  const expiringIngredients = useMemo(() => {
    const baseExpiring = filterExpiringWithin(ingredients, daysThreshold);

    if (!searchTerm.trim()) {
      return baseExpiring;
    }

    const cleanSearch = searchTerm.toLowerCase().trim();
    return baseExpiring.filter((item) =>
      item.name.toLowerCase().includes(cleanSearch)
    );
  }, [ingredients, daysThreshold, searchTerm]);

  const handlePress = (ingredient: Ingredient): void => {
    navigation.navigate('EditIngredient', { ingredient });
  };

  return (
    <View style={styles.flex1}>
      <Header />

      <IngredientList
        ingredients={expiringIngredients}
        onPress={handlePress}
        numColumns={numColumns}
        header={
          <>
            <TextInput
              style={styles.input}
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search for ingredients"
              placeholderTextColor={COLORS.placeholder}
            />

            <DaysThresholdControl
              value={daysThreshold}
              onChange={setDaysThreshold}
            />
          </>
        }
      />
    </View>
  );
};
