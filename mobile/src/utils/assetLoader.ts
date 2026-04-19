/**
 * Asset Loader Utility
 * Loads sticker assets from the local asset library based on asset IDs
 */

// Import sticker manifest - using require for JSON in React Native
const stickerManifest = require('../../assets/sticker_library/sticker_manifest.json');
import { ASSET_IMAGE_MAP } from '../data/sticker-assets';

export interface StickerAsset {
  id: string;
  name: string;
  category: string;
  path: string;
  tags: string[];
}

/**
 * Get all available assets from the manifest
 */
export function getAllAssets(): StickerAsset[] {
  return stickerManifest as StickerAsset[];
}

/**
 * Get asset by ID
 */
export function getAssetById(assetID: string): StickerAsset | null {
  const assets = getAllAssets();
  return assets.find((asset) => asset.id === assetID) || null;
}

/**
 * Get assets by category
 */
export function getAssetsByCategory(category: string): StickerAsset[] {
  const assets = getAllAssets();
  return assets.filter((asset) => asset.category === category);
}

/**
 * Get assets by tag
 */
export function getAssetsByTag(tag: string): StickerAsset[] {
  const assets = getAllAssets();
  return assets.filter((asset) => asset.tags.includes(tag));
}

/**
 * Load asset image based on asset ID
 * Returns a require() statement for the image
 */
export function loadAssetImage(assetID: string): any {
  const asset = getAssetById(assetID);
  if (!asset) {
    // Return a default placeholder if asset not found
    return null;
  }

  return ASSET_IMAGE_MAP[assetID] || null;
}

/**
 * Get emoji fallback for asset (for when image is not available)
 */
export function getAssetEmoji(assetID: string): string {
  const emojiMap: Record<string, string> = {
    // Fruits
    fruit_apple_red: '🍎',
    fruit_apple_green: '🍏',
    fruit_banana: '🍌',
    fruit_mango: '🥭',
    fruit_orange: '🍊',
    fruit_strawberry: '🍓',
    
    // Shapes
    shape_circle: '⭕',
    shape_heart: '❤️',
    shape_rectangle: '▭',
    shape_square: '⬜',
    shape_star: '⭐',
    shape_triangle: '🔺',
    
    // Money
    money_coin_1peso: '🪙',
    money_coin_5peso: '🪙',
    money_coin_10peso: '🪙',
    money_bill_20peso: '💵',
    money_bill_50peso: '💵',
    
    // Rewards
    reward_star_gold: '⭐',
    reward_star_silver: '⭐',
    reward_trophy: '🏆',

    // Numbers
    number_0: '0️⃣',
    number_1: '1️⃣',
    number_2: '2️⃣',
    number_3: '3️⃣',
    number_4: '4️⃣',
    number_5: '5️⃣',
    number_6: '6️⃣',
    number_7: '7️⃣',
    number_8: '8️⃣',
    number_9: '9️⃣',
    number_10: '🔟',
  };

  return emojiMap[assetID] || '📦';
}

