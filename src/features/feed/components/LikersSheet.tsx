// src/features/feed/components/LikersSheet.tsx

import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { PostLiker } from '../types';
import { useLikes } from '../hooks';
import { feedTheme } from '../theme';

interface LikersSheetProps {
  postId: string | null;
  likeCount: number;
  bottomSheetRef: React.RefObject<BottomSheet>;
  onClose: () => void;
  onUserPress?: (userId: string) => void;
}

export const LikersSheet: React.FC<LikersSheetProps> = ({
  postId,
  likeCount,
  bottomSheetRef,
  onClose,
  onUserPress,
}) => {
  const { fetchLikers } = useLikes();
  const [likers, setLikers] = React.useState<PostLiker[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  useEffect(() => {
    if (postId) {
      setIsLoading(true);
      fetchLikers(postId)
        .then(setLikers)
        .finally(() => setIsLoading(false));
    }
  }, [postId, fetchLikers]);

  const renderLiker = useCallback(({ item }: { item: PostLiker }) => (
    <TouchableOpacity
      style={styles.likerItem}
      onPress={() => onUserPress?.(item.id)}
      activeOpacity={0.7}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.likerInfo}>
        <Text style={styles.likerName}>{item.name}</Text>
        {item.username && (
          <Text style={styles.likerUsername}>@{item.username}</Text>
        )}
      </View>
    </TouchableOpacity>
  ), [onUserPress]);

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
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={['50%']}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={styles.container}>
        <Text style={styles.title}>
          {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
        </Text>

        <FlatList
          data={likers}
          renderItem={renderLiker}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading...' : 'No likes yet'}
            </Text>
          }
        />
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: feedTheme.spacing.screenPadding,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: feedTheme.colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  likerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    backgroundColor: feedTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  likerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  likerName: {
    fontSize: 15,
    fontWeight: '600',
    color: feedTheme.colors.textPrimary,
  },
  likerUsername: {
    fontSize: 13,
    color: feedTheme.colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: feedTheme.colors.textSecondary,
    marginTop: 40,
  },
});
