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
import { fetchProductByBarcode, BarcodeScanSuggestion } from '../services/openFoodFacts';

/**
 * AddScreen provides the entry form for adding a new ingredient,
 * with the barcode scan button placed prominently under the header.
 */
export const AddScreen: React.FC = () => {
  const { addIngredient } = useIngredients();
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [prefillData, setPrefillData] = useState<Awaited<ReturnType<typeof fetchProductByBarcode>>>(null);
  const [scannedSuggestion, setScannedSuggestion] = useState<BarcodeScanSuggestion | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = (ingredient: Ingredient): void => {
    addIngredient(ingredient);
    setScannedSuggestion(null);
    setShowSuccess(true);
  };

  const handleScanBarcode = (): void => {
    setIsScannerVisible(true);
  };

  const handleBarcodeScanned = async (barcode: string): Promise<void> => {
    const suggestion = await fetchProductByBarcode(barcode);

    if (!suggestion) {
      Alert.alert('Barcode scan', 'No product information was found for this barcode.');
      setIsScannerVisible(false);
      return;
    }

    setPrefillData({
      ...suggestion,
      barcode,
    });
    setIsScannerVisible(false);
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