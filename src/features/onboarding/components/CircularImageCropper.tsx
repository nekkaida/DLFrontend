import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Image,
  Platform,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_SIZE = Math.min(SCREEN_WIDTH * 0.7, 300);

interface CircularImageCropperProps {
  visible: boolean;
  imageUri: string;
  onCropComplete: (croppedUri: string) => void;
  onCancel: () => void;
}

/**
 * Simple preview modal that shows how the cropped image will look
 * as a circular profile picture. The actual cropping is done by
 * expo-image-picker's native editor (square aspect ratio).
 */
const CircularImageCropper: React.FC<CircularImageCropperProps> = ({
  visible,
  imageUri,
  onCropComplete,
  onCancel,
}) => {
  const handleConfirm = () => {
    // Image is already cropped by expo-image-picker, just confirm
    onCropComplete(imageUri);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Profile Picture Preview</Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.doneButton}>
            <Text style={styles.doneText}>Use Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Preview Area */}
        <View style={styles.previewArea}>
          <Text style={styles.instructionText}>
            This is how your profile picture will look
          </Text>
          
          {/* Circular Preview */}
          <View style={styles.circularPreviewContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.circularPreview}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.hintText}>
            Tip: Make sure your face is centered in the photo
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.select({ ios: 60, android: 40 }),
    paddingBottom: 20,
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  doneButton: {
    padding: 8,
  },
  doneText: {
    color: '#FE9F4D',
    fontSize: 16,
    fontWeight: '600',
  },
  previewArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 30,
    textAlign: 'center',
  },
  circularPreviewContainer: {
    marginBottom: 30,
  },
  circularPreview: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: PREVIEW_SIZE / 2,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  hintText: {
    color: '#AAAAAA',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default CircularImageCropper;
