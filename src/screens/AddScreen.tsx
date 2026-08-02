import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { Header } from '../components/Header';
import { IngredientForm } from '../components/IngredientForm';
import { useIngredients } from '../context/AppContext';
import { styles } from '../theme/styles';
import { Ingredient } from '../types';
import { fetchProductByBarcode } from '../services/openFoodFacts';

/**
 * AddScreen provides the entry form for adding a new ingredient.
 * It also includes the barcode action placeholder required by the pair project scope.
 */
export const AddScreen: React.FC = () => {
  const { addIngredient } = useIngredients();
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [prefillData, setPrefillData] = useState<Awaited<ReturnType<typeof fetchProductByBarcode>>>(null);

  const handleSave = (ingredient: Ingredient): void => {
    addIngredient(ingredient);
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

  return (
    <View style={styles.flex1}>
      <Header />
      <Text style={styles.sectionTitle}>Add ingredient</Text>
      <IngredientForm onSave={handleSave} isEdit={false} prefillData={prefillData} />
      <View style={styles.formPadding}>
        <TouchableOpacity style={styles.mainButton} onPress={handleScanBarcode}>
          <Text style={styles.buttonText}>Scan barcode</Text>
        </TouchableOpacity>
      </View>

      <BarcodeScannerModal
        visible={isScannerVisible}
        onClose={() => setIsScannerVisible(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />
    </View>
  );
};
