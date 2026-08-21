import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { SuccessMessage } from '../components/SuccessMessage';
import { Header } from '../components/Header';
import { IngredientForm } from '../components/IngredientForm';
import { useIngredients } from '../context/AppContext';
import { styles } from '../theme/styles';
import { Ingredient } from '../types';
import { BarcodeFetchError, BarcodeScanSuggestion, fetchProductByBarcode } from '../services/openFoodFacts';

/**
 * AddScreen is the main screen used to add a new ingredient, 
 * manually or from a barcode scan.
 */

export const AddScreen: React.FC = () => {
  const { addIngredient } = useIngredients();
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [prefillData, setPrefillData] = useState<BarcodeScanSuggestion | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = (ingredient: Ingredient): void => {
    addIngredient(ingredient);
    setPrefillData(null);
    setShowSuccess(true);
  };

  const handleScanBarcode = (): void => {
    setIsScannerVisible(true);
  };

  const handleBarcodeScanned = async (barcode: string): Promise<void> => {
    try {
      const suggestion = await fetchProductByBarcode(barcode);

      if (!suggestion) {
        Alert.alert('Barcode scan', 'No product information was found for this barcode.');
        return;
      }

      setPrefillData({
        ...suggestion,
        barcode,
      });
    } catch (error) {
      if (error instanceof BarcodeFetchError) {
        Alert.alert(
          'Barcode scan',
          'Could not reach OpenFoodFacts. Check your connection and try again.'
        );
      } else {
        Alert.alert('Barcode scan', 'Something went wrong while scanning. Please try again.');
      }
    } finally {
      setIsScannerVisible(false);
    }
  };

  if (showSuccess) {
    return (
      <View style={styles.flex1}>
        <Header />
        <SuccessMessage
          title="Ingredient added"
          description="Your ingredient has been added successfully."
          onContinue={() => setShowSuccess(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.flex1}>
      <Header />

      <View style={styles.addScreenScanBarcodeWrapper}>
        <TouchableOpacity
          style={styles.addScreenScanBarcodeButton}
          onPress={handleScanBarcode}
        >
          <Ionicons name="barcode-outline" size={22} color="#ffffff" />
          <Text style={styles.addScreenScanBarcodeText}>
            Scan Barcode
          </Text>
        </TouchableOpacity>
      </View>

      <IngredientForm onSave={handleSave} isEdit={false} prefillData={prefillData} />

      <BarcodeScannerModal
        visible={isScannerVisible}
        onClose={() => setIsScannerVisible(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />
    </View>
  );
};
