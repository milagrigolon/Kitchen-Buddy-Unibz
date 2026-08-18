import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { SuccessMessage } from '../components/SuccessMessage';
import { Header } from '../components/Header';
import { IngredientForm } from '../components/IngredientForm';
import { useIngredients } from '../context/AppContext';
import { COLORS, styles } from '../theme/styles';
import { Ingredient } from '../types';
import { fetchProductByBarcode, BarcodeFetchError } from '../services/openFoodFacts';

/**
 * AddScreen provides the entry form for adding a new ingredient,
 * with the barcode scan button placed prominently under the header.
 */
export const AddScreen: React.FC = () => {
  const { addIngredient } = useIngredients();
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [prefillData, setPrefillData] = useState<Awaited<ReturnType<typeof fetchProductByBarcode>>>(null);
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
    // fetchProductByBarcode now either:
    // - returns the suggestion (success)
    // - returns null (barcode not found in OpenFoodFacts — a normal case)
    // - throws BarcodeFetchError (network/parsing/server problem)
    const suggestion = await fetchProductByBarcode(barcode);

    if (!suggestion) {
      // this is the ONLY case where "not found" should be shown
      // the request worked, OpenFoodFacts just has no data for this barcode
      Alert.alert('Barcode scan', 'No product information was found for this barcode.');
      return;
    }

    setPrefillData({
      ...suggestion,
      barcode,
    });
  } catch (error) {
    // something technical went wrong (no internet, server error, bad JSON)
    // we show a different message so the user knows it's not their barcode's fault
    if (error instanceof BarcodeFetchError) {
      Alert.alert(
        'Barcode scan',
        'Could not reach OpenFoodFacts. Check your connection and try again.'
      );
    } else {
      // fallback for any unexpected error we didn't anticipate
      Alert.alert('Barcode scan', 'Something went wrong while scanning. Please try again.');
    }
  } finally {
    // finally runs no matter what happened above (success, not-found, or error) 
    // this guarantees the scanner modal always closes exactly once
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

      {/* SCAN BARCODE BUTTON*/}
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

      {/* Form component underneath */}
      <IngredientForm onSave={handleSave} isEdit={false} prefillData={prefillData} />

      <BarcodeScannerModal
        visible={isScannerVisible}
        onClose={() => setIsScannerVisible(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />
    </View>
  );
};