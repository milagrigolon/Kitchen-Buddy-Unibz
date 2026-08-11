import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IngredientForm } from '../components/IngredientForm';
import { BackButton } from '../components/BackButton';
import { SuccessMessage } from '../components/SuccessMessage';
import { useIngredients } from '../context/AppContext';
import { styles } from '../theme/styles';
import { Ingredient } from '../types';

type EditStackParamList = {
  EditIngredient: { ingredient: Ingredient };
};

type EditScreenProps = NativeStackScreenProps<EditStackParamList, 'EditIngredient'>;

export const EditScreen: React.FC<EditScreenProps> = ({ route, navigation }) => {
  const { ingredient } = route.params;
  const { updateIngredient, deleteIngredient } = useIngredients();

  // state for managing the confirmation of deletion and success messages
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

  // SUCCESS MESSAGE (Update or Delete)
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

  // CONFIRM ELIMINATION VIEW
  if (isConfirmingDelete) {
    return (
      <View style={styles.flex1}>
        <BackButton onPress={() => setIsConfirmingDelete(false)} title="Go back" />
        <View style={styles.addScreenSuccessContainer}>
          <Text style={styles.addScreenSuccessTitle}>Delete Ingredient?</Text>
          <Text style={styles.addScreenSuccessDescription}>
            Are you sure you want to delete "{ingredient.name}"?
          </Text>

          {/* Confirm Delete */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleConfirmDelete}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Confirm Delete</Text>
          </TouchableOpacity>

          {/* Tasto Cancel */}
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

  // NORMAL EDIT FORM VIEW
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