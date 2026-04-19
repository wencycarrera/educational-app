/**
 * Sticker Asset Library
 * 
 * This file contains the asset manifest and image mappings.
 * Update this file as you add new assets to the library.
 */

import { StickerAsset } from '../types/asset';

// Asset image mappings - Maps asset IDs to require() calls
// NOTE: Replace PLACEHOLDER_IMAGE with actual requires once you have the images
const PLACEHOLDER_IMAGE = require('../../assets/images/icon.png');

export const ASSET_IMAGE_MAP: Record<string, any> = {
  // Fruits
  fruit_apple_red: require('../../assets/sticker_library/fruits/fruit_apple_red.png'),
  fruit_apple_green: require('../../assets/sticker_library/fruits/fruit_apple_green.png'),
  fruit_banana: require('../../assets/sticker_library/fruits/fruit_banana.png'),
  fruit_orange: require('../../assets/sticker_library/fruits/fruit_orange.png'),
  fruit_strawberry: require('../../assets/sticker_library/fruits/fruit_strawberry.png'),
  fruit_mango: require('../../assets/sticker_library/fruits/fruit_mango.png'),

  // Shapes
  shape_circle: require('../../assets/sticker_library/shapes/shape_circle.png'),
  shape_square: require('../../assets/sticker_library/shapes/shape_square.png'),
  shape_triangle: require('../../assets/sticker_library/shapes/shape_triangle.png'),
  shape_rectangle: require('../../assets/sticker_library/shapes/shape_rectangle.png'),
  shape_star: require('../../assets/sticker_library/shapes/shape_star.png'),
  shape_heart: require('../../assets/sticker_library/shapes/shape_heart.png'),

  // Money
  money_coin_1peso: require('../../assets/sticker_library/money/money_coin_1peso.png'),
  money_coin_5peso: require('../../assets/sticker_library/money/money_coin_5peso.png'),
  money_coin_10peso: require('../../assets/sticker_library/money/money_coin_10peso.png'),
  money_bill_20peso: require('../../assets/sticker_library/money/money_bill_20peso.png'),
  money_bill_50peso: require('../../assets/sticker_library/money/money_bill_50peso.png'),

  // Numbers (0-20)
  number_0: require('../../assets/sticker_library/numbers/number_0.png'),
  number_1: require('../../assets/sticker_library/numbers/number_1.png'),
  number_2: require('../../assets/sticker_library/numbers/number_2.png'),
  number_3: require('../../assets/sticker_library/numbers/number_3.png'),
  number_4: require('../../assets/sticker_library/numbers/number_4.png'),
  number_5: require('../../assets/sticker_library/numbers/number_5.png'),
  number_6: require('../../assets/sticker_library/numbers/number_6.png'),
  number_7: require('../../assets/sticker_library/numbers/number_7.png'),
  number_8: require('../../assets/sticker_library/numbers/number_8.png'),
  number_9: require('../../assets/sticker_library/numbers/number_9.png'),
  number_10: require('../../assets/sticker_library/numbers/number_10.png'),
  number_11: require('../../assets/sticker_library/numbers/number_11.png'),
  number_12: require('../../assets/sticker_library/numbers/number_12.png'),
  number_13: require('../../assets/sticker_library/numbers/number_13.png'),
  number_14: require('../../assets/sticker_library/numbers/number_14.png'),
  number_15: require('../../assets/sticker_library/numbers/number_15.png'),
  number_16: require('../../assets/sticker_library/numbers/number_16.png'),
  number_17: require('../../assets/sticker_library/numbers/number_17.png'),
  number_18: require('../../assets/sticker_library/numbers/number_18.png'),
  number_19: require('../../assets/sticker_library/numbers/number_19.png'),
  number_20: require('../../assets/sticker_library/numbers/number_20.png'),

  // Math Symbols
  symbol_plus: require('../../assets/sticker_library/symbols/symbol_plus.png'),
  symbol_minus: require('../../assets/sticker_library/symbols/symbol_minus.png'),
  symbol_equals: require('../../assets/sticker_library/symbols/symbol_equals.png'),
  symbol_greater_than: require('../../assets/sticker_library/symbols/symbol_greater_than.png'),
  symbol_less_than: require('../../assets/sticker_library/symbols/symbol_less_than.png'),

  // Objects
  object_block: require('../../assets/sticker_library/objects/object_block.png'),
  object_basket: require('../../assets/sticker_library/objects/object_basket.png'),
  object_box: require('../../assets/sticker_library/objects/object_box.png'),

  // Measurement Tools
  tool_ruler: require('../../assets/sticker_library/tools/tool_ruler.png'),
  tool_scale: require('../../assets/sticker_library/tools/tool_scale.png'),
  tool_clock: require('../../assets/sticker_library/tools/tool_clock.png'),

  // Patterns
  pattern_circle_red: require('../../assets/sticker_library/patterns/pattern_circle_red.png'),
  pattern_circle_blue: require('../../assets/sticker_library/patterns/pattern_circle_blue.png'),
  pattern_circle_yellow: require('../../assets/sticker_library/patterns/pattern_circle_yellow.png'),
  pattern_circle_green: require('../../assets/sticker_library/patterns/pattern_circle_green.png'),
  pattern_square_red: require('../../assets/sticker_library/patterns/pattern_square_red.png'),
  pattern_square_blue: require('../../assets/sticker_library/patterns/pattern_square_blue.png'),
  pattern_square_yellow: require('../../assets/sticker_library/patterns/pattern_square_yellow.png'),
  pattern_square_green: require('../../assets/sticker_library/patterns/pattern_square_green.png'),

  // Rewards
  reward_star_gold: require('../../assets/sticker_library/rewards/reward_star_gold.png'),
  reward_star_silver: require('../../assets/sticker_library/rewards/reward_star_silver.png'),
  reward_trophy: require('../../assets/sticker_library/rewards/reward_trophy.png'),
};

// Asset manifest - matches sticker_manifest.json structure
export const STICKER_ASSETS: StickerAsset[] = [
  {
    id: 'fruit_apple_red',
    name: 'Red Apple',
    category: 'Fruits',
    path: './fruits/fruit_apple_red.png',
    tags: ['counting', 'fruit', 'food'],
  },
  {
    id: 'fruit_apple_green',
    name: 'Green Apple',
    category: 'Fruits',
    path: './fruits/fruit_apple_green.png',
    tags: ['counting', 'fruit', 'food'],
  },
  {
    id: 'fruit_banana',
    name: 'Banana',
    category: 'Fruits',
    path: './fruits/fruit_banana.png',
    tags: ['counting', 'fruit', 'food'],
  },
  {
    id: 'fruit_orange',
    name: 'Orange',
    category: 'Fruits',
    path: './fruits/fruit_orange.png',
    tags: ['counting', 'fruit', 'food'],
  },
  {
    id: 'fruit_strawberry',
    name: 'Strawberry',
    category: 'Fruits',
    path: './fruits/fruit_strawberry.png',
    tags: ['counting', 'fruit', 'food'],
  },
  {
    id: 'fruit_mango',
    name: 'Mango',
    category: 'Fruits',
    path: './fruits/fruit_mango.png',
    tags: ['counting', 'fruit', 'food', 'filipino'],
  },
  {
    id: 'shape_circle',
    name: 'Circle',
    category: 'Shapes',
    path: './shapes/shape_circle.png',
    tags: ['shape', 'geometry', 'pattern'],
  },
  {
    id: 'shape_square',
    name: 'Square',
    category: 'Shapes',
    path: './shapes/shape_square.png',
    tags: ['shape', 'geometry', 'pattern'],
  },
  {
    id: 'shape_triangle',
    name: 'Triangle',
    category: 'Shapes',
    path: './shapes/shape_triangle.png',
    tags: ['shape', 'geometry', 'pattern'],
  },
  {
    id: 'shape_rectangle',
    name: 'Rectangle',
    category: 'Shapes',
    path: './shapes/shape_rectangle.png',
    tags: ['shape', 'geometry', 'pattern'],
  },
  {
    id: 'shape_star',
    name: 'Star',
    category: 'Shapes',
    path: './shapes/shape_star.png',
    tags: ['shape', 'geometry', 'pattern', 'reward'],
  },
  {
    id: 'shape_heart',
    name: 'Heart',
    category: 'Shapes',
    path: './shapes/shape_heart.png',
    tags: ['shape', 'geometry', 'pattern'],
  },
  {
    id: 'money_coin_1peso',
    name: '1 Peso Coin',
    category: 'Money',
    path: './money/money_coin_1peso.png',
    tags: ['money', 'philippine', 'peso', 'coin'],
  },
  {
    id: 'money_coin_5peso',
    name: '5 Peso Coin',
    category: 'Money',
    path: './money/money_coin_5peso.png',
    tags: ['money', 'philippine', 'peso', 'coin'],
  },
  {
    id: 'money_coin_10peso',
    name: '10 Peso Coin',
    category: 'Money',
    path: './money/money_coin_10peso.png',
    tags: ['money', 'philippine', 'peso', 'coin'],
  },
  {
    id: 'money_bill_20peso',
    name: '20 Peso Bill',
    category: 'Money',
    path: './money/money_bill_20peso.png',
    tags: ['money', 'philippine', 'peso', 'bill'],
  },
  {
    id: 'money_bill_50peso',
    name: '50 Peso Bill',
    category: 'Money',
    path: './money/money_bill_50peso.png',
    tags: ['money', 'philippine', 'peso', 'bill'],
  },
  // Numbers 0-20
  ...Array.from({ length: 21 }, (_, i) => ({
    id: `number_${i}`,
    name: `Number ${i}`,
    category: 'Numbers',
    path: `./numbers/number_${i}.png`,
    tags: ['number', 'counting', 'numeral'],
  })),
  {
    id: 'symbol_plus',
    name: 'Plus Sign',
    category: 'Math Symbols',
    path: './symbols/symbol_plus.png',
    tags: ['math', 'addition', 'symbol'],
  },
  {
    id: 'symbol_minus',
    name: 'Minus Sign',
    category: 'Math Symbols',
    path: './symbols/symbol_minus.png',
    tags: ['math', 'subtraction', 'symbol'],
  },
  {
    id: 'symbol_equals',
    name: 'Equals Sign',
    category: 'Math Symbols',
    path: './symbols/symbol_equals.png',
    tags: ['math', 'equality', 'symbol'],
  },
  {
    id: 'symbol_greater_than',
    name: 'Greater Than',
    category: 'Math Symbols',
    path: './symbols/symbol_greater_than.png',
    tags: ['math', 'comparison', 'symbol'],
  },
  {
    id: 'symbol_less_than',
    name: 'Less Than',
    category: 'Math Symbols',
    path: './symbols/symbol_less_than.png',
    tags: ['math', 'comparison', 'symbol'],
  },
  {
    id: 'object_block',
    name: 'Counting Block',
    category: 'Objects',
    path: './objects/object_block.png',
    tags: ['counting', 'object', 'block'],
  },
  {
    id: 'object_basket',
    name: 'Basket',
    category: 'Objects',
    path: './objects/object_basket.png',
    tags: ['container', 'object', 'collection'],
  },
  {
    id: 'object_box',
    name: 'Box',
    category: 'Objects',
    path: './objects/object_box.png',
    tags: ['container', 'object', 'collection'],
  },
  {
    id: 'tool_ruler',
    name: 'Ruler',
    category: 'Measurement',
    path: './tools/tool_ruler.png',
    tags: ['measurement', 'length', 'tool'],
  },
  {
    id: 'tool_scale',
    name: 'Balance Scale',
    category: 'Measurement',
    path: './tools/tool_scale.png',
    tags: ['measurement', 'weight', 'tool'],
  },
  {
    id: 'tool_clock',
    name: 'Clock',
    category: 'Measurement',
    path: './tools/tool_clock.png',
    tags: ['measurement', 'time', 'tool'],
  },
  // Pattern elements
  {
    id: 'pattern_circle_red',
    name: 'Red Circle',
    category: 'Patterns',
    path: './patterns/pattern_circle_red.png',
    tags: ['pattern', 'color', 'circle'],
  },
  {
    id: 'pattern_circle_blue',
    name: 'Blue Circle',
    category: 'Patterns',
    path: './patterns/pattern_circle_blue.png',
    tags: ['pattern', 'color', 'circle'],
  },
  {
    id: 'pattern_circle_yellow',
    name: 'Yellow Circle',
    category: 'Patterns',
    path: './patterns/pattern_circle_yellow.png',
    tags: ['pattern', 'color', 'circle'],
  },
  {
    id: 'pattern_circle_green',
    name: 'Green Circle',
    category: 'Patterns',
    path: './patterns/pattern_circle_green.png',
    tags: ['pattern', 'color', 'circle'],
  },
  {
    id: 'pattern_square_red',
    name: 'Red Square',
    category: 'Patterns',
    path: './patterns/pattern_square_red.png',
    tags: ['pattern', 'color', 'square'],
  },
  {
    id: 'pattern_square_blue',
    name: 'Blue Square',
    category: 'Patterns',
    path: './patterns/pattern_square_blue.png',
    tags: ['pattern', 'color', 'square'],
  },
  {
    id: 'pattern_square_yellow',
    name: 'Yellow Square',
    category: 'Patterns',
    path: './patterns/pattern_square_yellow.png',
    tags: ['pattern', 'color', 'square'],
  },
  {
    id: 'pattern_square_green',
    name: 'Green Square',
    category: 'Patterns',
    path: './patterns/pattern_square_green.png',
    tags: ['pattern', 'color', 'square'],
  },
  {
    id: 'reward_star_gold',
    name: 'Gold Star',
    category: 'Rewards',
    path: './rewards/reward_star_gold.png',
    tags: ['reward', 'gamification', 'star'],
  },
  {
    id: 'reward_star_silver',
    name: 'Silver Star',
    category: 'Rewards',
    path: './rewards/reward_star_silver.png',
    tags: ['reward', 'gamification', 'star'],
  },
  {
    id: 'reward_trophy',
    name: 'Trophy',
    category: 'Rewards',
    path: './rewards/reward_trophy.png',
    tags: ['reward', 'gamification', 'achievement'],
  },
];

/**
 * Get image source for an asset ID
 */
export function getAssetImage(assetId: string): any {
  return ASSET_IMAGE_MAP[assetId] || PLACEHOLDER_IMAGE;
}

/**
 * Get asset by ID
 */
export function getAssetById(assetId: string): StickerAsset | undefined {
  return STICKER_ASSETS.find((asset) => asset.id === assetId);
}

/**
 * Get assets by category
 */
export function getAssetsByCategory(category: string): StickerAsset[] {
  if (category === 'All') {
    return STICKER_ASSETS;
  }
  return STICKER_ASSETS.filter((asset) => asset.category === category);
}

/**
 * Search assets by name or tags
 */
export function searchAssets(query: string): StickerAsset[] {
  const lowerQuery = query.toLowerCase();
  return STICKER_ASSETS.filter(
    (asset) =>
      asset.name.toLowerCase().includes(lowerQuery) ||
      asset.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

