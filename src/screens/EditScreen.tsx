import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { IngredientForm } from '../components/IngredientForm';
import { BackButton } from '../components/BackButton';
import { SuccessMessage } from '../components/SuccessMessage';
import { useIngredients } from '../context/AppContext';
import { styles } from '../theme/styles';
import { Ingredient } from '../types';

type EditStackParamList = {
  EditIngredient: { ingredient: Ingredient };
};

type EditScreenProps = StackScreenProps<EditStackParamList, 'EditIngredient'>;

/**
 * EditScreen is a component for editing an existing ingredient.
 * It provides a form pre-filled with the ingredient's current data, allowing 
 * users to update or delete the ingredient.
 */
export const EditScreen: React.FC<EditScreenProps> = ({ route, navigation }) => {
  const { ingredient } = route.params;
  const { updateIngredient, deleteIngredient } = useIngredients();

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [successState, setSuccessState] = useState<{ title: string; description: string } | null>(null);

  const handleSave = (updatedIngredient: Ingredient): void => {
    updateIngredient(updatedIngredient);
    setSuccessState({
      title: 'Ingredient updated',
      description: 'Your ingredient has been updated successfully.',
    });
  };

  const handleDeleteRequest = (): void => {
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = (): void => {
    deleteIngredient(ingredient.id);
    setIsConfirmingDelete(false);
    setSuccessState({
      title: 'Ingredient deleted',
      description: 'Your ingredient has been deleted successfully.',
    });
  };

  if (successState) {
    return (
      <View style={styles.flex1}>
        <BackButton onPress={() => navigation.goBack()} title="Go back" />
        <SuccessMessage
          title={successState.title}
          description={successState.description}
          onContinue={() => navigation.goBack()}
        />
      </View>
    );
  }

  if (isConfirmingDelete) {
    return (
      <View style={styles.flex1}>
        <BackButton onPress={() => setIsConfirmingDelete(false)} title="Go back" />
        <View style={styles.addScreenSuccessContainer}>
          <Text style={styles.addScreenSuccessTitle}>Delete Ingredient?</Text>
          <Text style={styles.addScreenSuccessDescription}>
            Are you sure you want to delete "{ingredient.name}"?
          </Text>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleConfirmDelete}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Confirm Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setIsConfirmingDelete(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex1}>
      <BackButton onPress={() => navigation.goBack()} title="Go back" />
      <IngredientForm
        initialData={ingredient}
        onSave={handleSave}
        onDelete={handleDeleteRequest}
        onCancel={() => navigation.goBack()}
        isEdit={true}
      />
    </View>
  );
};