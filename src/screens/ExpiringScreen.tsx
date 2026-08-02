import React, { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DaysThresholdControl } from '../components/DaysThresholdControl';
import { Header } from '../components/Header';
import { IngredientList } from '../components/IngredientList';
import { useIngredients } from '../context/AppContext';
import { styles } from '../theme/styles';
import { Ingredient } from '../types';
import { filterExpiringWithin } from '../utils/helpers';

type ExpiringStackParamList = {
  ExpiringHome: undefined;
  EditIngredient: { ingredient: Ingredient };
};

type ExpiringScreenProps = NativeStackScreenProps<ExpiringStackParamList, 'ExpiringHome'>;

/**
 * ExpiringScreen shows ingredients that are nearing their expiration date.
 */
export const ExpiringScreen: React.FC<ExpiringScreenProps> = ({ navigation }) => {
  const { ingredients } = useIngredients();
  const [daysThreshold, setDaysThreshold] = useState<number>(7);

  const expiringIngredients = useMemo(
    () => filterExpiringWithin(ingredients, daysThreshold),
    [ingredients, daysThreshold]
  );

  const handlePress = (ingredient: Ingredient): void => {
    navigation.navigate('EditIngredient', { ingredient });
  };

  return (
    <View style={styles.flex1}>
      <Header />
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Expiring soon</Text>
        <DaysThresholdControl value={daysThreshold} onChange={setDaysThreshold} />
        <IngredientList ingredients={expiringIngredients} onPress={handlePress} />
      </View>
    </View>
  );
};
