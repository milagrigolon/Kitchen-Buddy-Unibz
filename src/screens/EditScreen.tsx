import React from 'react';
import { View, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IngredientForm } from '../components/IngredientForm';
import { useIngredients } from '../context/AppContext';
import { styles } from '../theme/styles';
import { Ingredient } from '../types';

type EditStackParamList = {
  EditIngredient: { ingredient: Ingredient };
};

type EditScreenProps = NativeStackScreenProps<EditStackParamList, 'EditIngredient'>;

/**
 * EditScreen loads the ingredient from navigation parameters and lets the user
 * update it through the same reusable form used for addition.
 */
export const EditScreen: React.FC<EditScreenProps> = ({ route, navigation }) => {
  const { updateIngredient } = useIngredients();

  return (
    <View style={styles.flex1}>
      <Text style={styles.sectionTitle}>Edit ingredient</Text>
      <IngredientForm
        initialData={route.params.ingredient}
        onSave={(ingredient) => updateIngredient(ingredient)}
        onCancel={() => navigation.goBack()}
        isEdit={true}
      />
    </View>
  );
};
