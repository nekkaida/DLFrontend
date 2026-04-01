// src/features/feed/components/PostOptionsSheet.tsx

import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { feedTheme } from '../theme';

interface PostOptionsSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  isOwnPost: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReport?: () => void;
}

export const PostOptionsSheet: React.FC<PostOptionsSheetProps> = ({
  bottomSheetRef,
  isOwnPost,
  onClose,
  onEdit,
  onDelete,
  onReport,
}) => {
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  }, [onDelete]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: feedTheme.colors.border }}
    >
      <BottomSheetView style={styles.container}>
        {isOwnPost ? (
          <>
            <TouchableOpacity style={styles.option} onPress={onEdit} activeOpacity={0.7}>
              <Ionicons name="pencil-outline" size={22} color={feedTheme.colors.textPrimary} />
              <Text style={styles.optionText}>Edit Caption</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={handleDelete} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={22} color="#FF3B30" />
              <Text style={[styles.optionText, styles.deleteText]}>Delete Post</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.option} onPress={onReport} activeOpacity={0.7}>
            <Ionicons name="flag-outline" size={22} color="#FF9500" />
            <Text style={styles.optionText}>Report Post</Text>
          </TouchableOpacity>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: feedTheme.spacing.screenPadding,
    paddingTop: 8,
    paddingBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  optionText: {
    fontSize: 16,
    color: feedTheme.colors.textPrimary,
    marginLeft: 14,
  },
  deleteText: {
    color: '#FF3B30',
  },
});
