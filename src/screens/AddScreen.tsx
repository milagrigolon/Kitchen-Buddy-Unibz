import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { Header } from '../components/Header';
import { IngredientForm } from '../components/IngredientForm';
import { useIngredients } from '../context/AppContext';
import { COLORS, styles } from '../theme/styles';
import { Ingredient } from '../types';
import { fetchProductByBarcode } from '../services/openFoodFacts';

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
        <View style={styles.addScreenSuccessContainer}>
          <View style={styles.addScreenSuccessIcon}>
            <MaterialCommunityIcons name="check" size={52} color={COLORS.primary} />
          </View>

          <Text style={styles.addScreenSuccessTitle}>
            Ingredient added
          </Text>
          <Text style={styles.addScreenSuccessDescription}>
            Your ingredient has been added successfully.
          </Text>

          <TouchableOpacity
            style={styles.addScreenContinueButton}
            onPress={() => setShowSuccess(false)}
          >
            <Text style={styles.addScreenContinueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex1}>
      <Header />
      <Text style={styles.sectionTitle}>Add ingredient</Text>

      {/* SCAN BARCODE BUTTON - Orange Styled */}
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