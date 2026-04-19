import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
} from 'react-native';
import { theme } from '../../config/theme';
import { Heading } from '../ui/Heading';
import { Body } from '../ui/Body';
import { Card } from '../ui/Card';
import { StickerAsset } from '../../types/asset';
import * as Haptics from 'expo-haptics';
import {
  STICKER_ASSETS,
  getAssetImage,
} from '../../data/sticker-assets';

export interface AssetPickerProps {
  onSelectAsset: (assetId: string) => void;
  onSelectAssets?: (assetIds: string[]) => void; // For multi-select mode
  selectedAssetId?: string;
  selectedAssetIds?: string[]; // For multi-select mode
  showCategories?: boolean;
  multiSelect?: boolean; // Enable multi-select mode
  maxSelections?: number; // Maximum number of assets that can be selected (for multi-select)
}

/**
 * AssetPicker Component
 * 
 * Displays a grid of stickers/assets from the local library.
 * Teachers can browse by category and select assets for their lessons.
 * 
 * @example
 * <AssetPicker 
 *   onSelectAsset={(assetId) => console.log('Selected:', assetId)}
 *   selectedAssetId="fruit_apple_red"
 * />
 */
export const AssetPicker: React.FC<AssetPickerProps> = ({
  onSelectAsset,
  onSelectAssets,
  selectedAssetId,
  selectedAssetIds = [],
  showCategories = true,
  multiSelect = false,
  maxSelections,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>(selectedAssetIds || []);

  // Sync external selectedAssetIds into internal state when prop changes
  React.useEffect(() => {
    setInternalSelectedIds(selectedAssetIds || []);
  }, [selectedAssetIds]);

  // Get all assets with image sources
  const allAssets = useMemo(() => {
    return STICKER_ASSETS.map((asset) => ({
      ...asset,
      imageSource: getAssetImage(asset.id),
    }));
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['All', ...new Set(allAssets.map((a) => a.category))];
    return cats.map((cat) => ({
      name: cat,
      count: cat === 'All' ? allAssets.length : allAssets.filter((a) => a.category === cat).length,
    }));
  }, [allAssets]);

  // Filter assets by category and search
  const filteredAssets = useMemo(() => {
    let filtered = allAssets;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((asset) => asset.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (asset) =>
          asset.name.toLowerCase().includes(query) ||
          asset.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [allAssets, selectedCategory, searchQuery]);

  const handleAssetSelect = (assetId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (multiSelect) {
      // Multi-select mode
      let newSelection: string[];
      if (internalSelectedIds.includes(assetId)) {
        // Deselect
        newSelection = internalSelectedIds.filter(id => id !== assetId);
      } else {
        // Select (check max limit)
        if (maxSelections && internalSelectedIds.length >= maxSelections) {
          // Don't allow more selections
          return;
        }
        newSelection = [...internalSelectedIds, assetId];
      }
      setInternalSelectedIds(newSelection);
      if (onSelectAssets) {
        onSelectAssets(newSelection);
      }
    } else {
      // Single-select mode
      onSelectAsset(assetId);
    }
  };

  const renderCategoryButton = (category: { name: string; count: number }) => {
    const isSelected = selectedCategory === category.name;
    return (
      <TouchableOpacity
        key={category.name}
        onPress={() => setSelectedCategory(category.name)}
        style={[
          styles.categoryButton,
          isSelected && styles.categoryButtonSelected,
        ]}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.categoryButtonText,
            isSelected && styles.categoryButtonTextSelected,
          ]}
        >
          {category.name} ({category.count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAssetItem = ({ item }: { item: StickerAsset & { imageSource: any } }) => {
    const isSelected = multiSelect 
      ? internalSelectedIds.includes(item.id)
      : selectedAssetId === item.id;
    const isMaxReached = multiSelect && maxSelections && internalSelectedIds.length >= maxSelections && !isSelected;
    
    return (
      <TouchableOpacity
        onPress={() => handleAssetSelect(item.id)}
        style={[
          styles.assetItem,
          isSelected && styles.assetItemSelected,
          isMaxReached && styles.assetItemDisabled,
        ]}
        activeOpacity={0.7}
        disabled={isMaxReached}
      >
        <View style={styles.assetImageContainer}>
          <Image
            source={item.imageSource}
            style={styles.assetImage}
            resizeMode="contain"
          />
          {isSelected && (
            <View style={styles.selectedOverlay}>
              <View style={styles.selectedCheckmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            </View>
          )}
          {multiSelect && isSelected && (
            <View style={styles.multiSelectBadge}>
              <Text style={styles.multiSelectBadgeText}>
                {internalSelectedIds.indexOf(item.id) + 1}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.assetName} numberOfLines={1}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Heading level="h3" style={styles.title}>
          {multiSelect ? 'Select Stickers' : 'Select Sticker'}
        </Heading>
        <Body size="small" style={styles.subtitle}>
          {multiSelect 
            ? `Choose ${maxSelections ? `up to ${maxSelections} ` : ''}assets for your lesson activity`
            : 'Choose an asset for your lesson activity'}
        </Body>
        {multiSelect && internalSelectedIds.length > 0 && (
          <Body size="small" style={styles.selectionCount}>
            {internalSelectedIds.length} {internalSelectedIds.length === 1 ? 'asset' : 'assets'} selected
          </Body>
        )}
      </View>

      {showCategories && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map(renderCategoryButton)}
        </ScrollView>
      )}

      {filteredAssets.length === 0 ? (
        <Card padding="large" style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {searchQuery
              ? `No assets found for "${searchQuery}"`
              : 'No assets available in this category'}
          </Text>
          <Text style={styles.emptyStateHint}>
            Generate assets using the Canva AI prompts and add them to the sticker library folder.
          </Text>
        </Card>
      ) : (
        <FlatList
          data={filteredAssets}
          renderItem={renderAssetItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.assetsGrid}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.light,
  },
  header: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[2],
  },
  title: {
    marginBottom: theme.spacing[1],
  },
  subtitle: {
    color: theme.colors.gray[600],
  },
  categoriesContainer: {
    maxHeight: 60,
    marginBottom: theme.spacing[2],
  },
  categoriesContent: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    gap: theme.spacing[2],
  },
  categoryButton: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.gray[100],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  categoryButtonSelected: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[600],
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.gray[700],
  },
  categoryButtonTextSelected: {
    color: '#ffffff',
  },
  assetsGrid: {
    padding: theme.spacing[4],
    gap: theme.spacing[3],
  },
  assetItem: {
    flex: 1,
    maxWidth: '33.33%',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
    padding: theme.spacing[2],
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.light,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  assetItemSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  assetImageContainer: {
    width: 80,
    height: 80,
    marginBottom: theme.spacing[1],
    position: 'relative',
  },
  assetImage: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(250, 161, 35, 0.2)',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  assetName: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.gray[700],
    textAlign: 'center',
    marginTop: theme.spacing[1],
  },
  assetItemDisabled: {
    opacity: 0.5,
  },
  multiSelectBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  multiSelectBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectionCount: {
    color: theme.colors.primary[600],
    fontWeight: '600',
    marginTop: theme.spacing[1],
  },
  emptyState: {
    margin: theme.spacing[4],
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.gray[700],
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  emptyStateHint: {
    fontSize: 14,
    color: theme.colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
});

