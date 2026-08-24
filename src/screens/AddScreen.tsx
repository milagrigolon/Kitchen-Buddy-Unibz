import React, { useState, useEffect } from 'react';
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
  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const handleSave = (ingredient: Ingredient): void => {
    addIngredient(ingredient);
    setPrefillData(null);
    setShowSuccess(true);
  };

  const handleScanBarcode = (): void => {
    setIsScannerVisible(true);
  };

  const handleBarcodeScanned = (barcode: string): void => {
    if (isLookingUp) {
      return;
    }
    setPendingBarcode(barcode);
  };

  // Runs whenever pendingBarcode changes 
  // (right after a new scan comes in from BarcodeScannerModal via handleBarcodeScanned).
  useEffect(() => {
    // No barcode waiting to be looked up (initial render, or after we've
    // already cleared it below) — nothing to do.
    if (!pendingBarcode) {
      return;
    }

    // Local flag to detect if this effect run gets cleaned up (e.g. component
    // unmounts, or pendingBarcode changes again) before the async work below finishes
    let cancelled = false;

    // Mark a lookup as in progress. While true, handleBarcodeScanned ignores
    // any further scans, so a second scan can't start a second lookup.
    setIsLookingUp(true);

    const runLookup = async (): Promise<void> => {
      try {
        // OpenFoodFacts for this barcode
        const suggestion = await fetchProductByBarcode(pendingBarcode);

        // If this run was cancelled while the fetch was in
        // flight, bail out silently — don't update state or show alerts.
        if (cancelled) {
          return;
        }

        // fetchProductByBarcode resolves to null when no product was found
        // (unknown barcode, missing name, etc.) — show a single alert and stop.
        if (!suggestion) {
          Alert.alert('Barcode scan', 'No product information was found for this barcode.');
          return;
        }

        // Product found — prefill the form with it
        setPrefillData({
          ...suggestion,
          barcode: pendingBarcode,
        });
      } catch (error) {
        // ignore errors from a superseded run
        if (cancelled) {
          return;
        }

        // Distinguish network/parsing failures (BarcodeFetchError) from any
        // other unexpected error, and show the appropriate alert.
        if (error instanceof BarcodeFetchError) {
          Alert.alert(
            'Barcode scan',
            'Could not reach OpenFoodFacts. Check your connection and try again.'
          );
        } else {
          Alert.alert('Barcode scan', 'Something went wrong while scanning. Please try again.');
        }
      } finally {
        // Only clean up state if this run wasn't cancelled — otherwise we'd
        // be resetting state on behalf of a run that no longer applies.
        if (!cancelled) {
          setIsLookingUp(false);      // allow the next scan to trigger a lookup
          setPendingBarcode(null);    // clear so this effect doesn't re-fire on itself
          setIsScannerVisible(false); // close the scanner
        }
      }
    };

    // Fire the async lookup. void tells TS/lint not
    // awaiting this promise inside the effect (effects can't be async)
    void runLookup();

    // Cleanup function: React calls this before the effect re-runs (i.e. if
    // pendingBarcode changes again) or when the component unmounts. 
    // Setting cancelled = true makes any still-pending runLookup() from the previous
    // run a no-op once it resolves.
    return () => {
      cancelled = true;
    };
  }, [pendingBarcode]); // re-run only when a new barcode comes in
  

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
