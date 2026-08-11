import React, { useMemo, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
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

type ExpiringScreenProps = NativeStackScreenProps<ExpiringStackParamList, 'ExpiringHome'>;

/**
 * ExpiringScreen shows ingredients that are nearing their expiration date,
 * filtered by days threshold and search text.
 */
export const ExpiringScreen: React.FC<ExpiringScreenProps> = ({ navigation }) => {
  const { ingredients } = useIngredients();
  const [daysThreshold, setDaysThreshold] = useState<number>(7);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const expiringIngredients = useMemo(() => {
    // 1. filter ingredients based on the expiring days
    const baseExpiring = filterExpiringWithin(ingredients, daysThreshold);

    // 2. if no text, then render the list
    if (!searchTerm.trim()) {
      return baseExpiring;
    }

    // 3. otherwise filter also by name
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
      <View style={styles.listContainer}>

        {/* INPUT TERM for SEARCH */}
        <TextInput
          style={styles.input}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search for ingredients"
          placeholderTextColor={COLORS.placeholder}
        />

        <DaysThresholdControl value={daysThreshold} onChange={setDaysThreshold} />
        <IngredientList ingredients={expiringIngredients} onPress={handlePress} />
      </View>
    </View>
  );
};