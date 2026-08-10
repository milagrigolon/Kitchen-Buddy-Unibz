import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { IngredientForm } from '../components/IngredientForm';
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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 10,
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: COLORS.primaryLight,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
          }}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={[styles.sectionTitle, { margin: 0, textAlign: 'left', flex: 1 }]}>Edit ingredient</Text>
      </View>
      <IngredientForm
        initialData={route.params.ingredient}
        onSave={(ingredient) => updateIngredient(ingredient)}
        onCancel={() => navigation.goBack()}
        isEdit={true}
      />
    </View>
  );
};
