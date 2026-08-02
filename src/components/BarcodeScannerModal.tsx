import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarCodeScanner, PermissionResponse } from 'expo-barcode-scanner';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeScanned: (barcode: string) => void;
}

/**
 * BarcodeScannerModal handles the camera permission request and shows a simple
 * scanner overlay for the add-ingredient workflow.
 */
export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ visible, onClose, onBarcodeScanned }) => {
  const [permission, setPermission] = useState<PermissionResponse | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let isMounted = true;

    const askForPermission = async (): Promise<void> => {
      const response = await BarCodeScanner.requestPermissionsAsync();

      if (isMounted) {
        setPermission(response);
        setScanned(false);
      }
    };

    void askForPermission();

    return () => {
      isMounted = false;
    };
  }, [visible]);

  const handleScan = (result: { data: string }): void => {
    if (scanned) {
      return;
    }

    setScanned(true);
    onBarcodeScanned(result.data);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Scan product barcode</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>

        {permission?.granted ? (
          <BarCodeScanner onBarCodeScanned={handleScan} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>
              Camera access is required to scan a barcode.
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2563eb',
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  closeButtonText: {
    color: '#2563eb',
    fontWeight: '700',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#0f172a',
  },
});
