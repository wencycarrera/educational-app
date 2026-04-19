/**
 * Asset/Sticker Library Types
 * For the local sticker library used in lesson activities
 */

export interface StickerAsset {
  id: string;
  name: string;
  category: string;
  path: string;
  tags: string[];
}

export interface AssetCategory {
  name: string;
  count: number;
}

