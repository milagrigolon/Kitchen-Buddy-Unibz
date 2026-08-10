import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { IngredientForm } from '../components/IngredientForm';
import { BackButton } from '../components/BackButton';
import { useIngredients } from '../context/AppContext';
import { styles, COLORS } from '../theme/styles';
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
      <BackButton onPress={() => navigation.goBack()} title="Go back" />
      <IngredientForm
        initialData={route.params.ingredient}
        onSave={(ingredient) => updateIngredient(ingredient)}
        onCancel={() => navigation.goBack()}
        isEdit={true}
      />
    </View>
  );
};
