# Sticker Library - Asset Management Guide

This folder contains all the educational stickers/assets used in KidVenture lesson activities.

## 📁 Folder Structure

```
sticker_library/
├── fruits/          # Fruit stickers (apples, bananas, etc.)
├── shapes/          # Geometric shapes (circle, square, etc.)
├── money/           # Philippine Peso coins and bills
├── numbers/         # Number stickers (0-20)
├── symbols/         # Math symbols (+, -, =, etc.)
├── objects/         # Counting objects (blocks, baskets, etc.)
├── tools/           # Measurement tools (ruler, scale, clock)
├── patterns/        # Pattern elements (colored shapes)
├── rewards/         # Reward stickers (stars, trophies)
├── sticker_manifest.json  # Asset metadata (legacy, use sticker-assets.ts instead)
└── README.md        # This file
```

## 🎨 Adding New Assets

### Step 1: Generate Assets
Use the Canva AI prompts in `CANVA_AI_ASSET_GENERATION_PROMPT.md` to generate your stickers.

### Step 2: Save Assets
1. Save your generated PNG files (512x512px, transparent background) in the appropriate category folder
2. Use the naming convention: `[category]_[name].png`
   - Example: `apple_red.png`, `circle.png`, `coin_1peso.png`

### Step 3: Update Asset Mappings
1. Open `mobile/src/data/sticker-assets.ts`
2. Add your asset to the `STICKER_ASSETS` array:
   ```typescript
   {
     id: 'fruit_apple_red',
     name: 'Red Apple',
     category: 'Fruits',
     path: './fruits/apple_red.png',
     tags: ['counting', 'fruit', 'food'],
   }
   ```
3. Add the require() mapping in `ASSET_IMAGE_MAP`:
   ```typescript
   fruit_apple_red: require('../../assets/sticker_library/fruits/apple_red.png'),
   ```

### Step 4: Test
The AssetPicker component will automatically show your new asset once it's added to the mappings.

## 📋 Asset Requirements

- **Format**: PNG with transparent background
- **Size**: 512x512 pixels or 600x600 pixels (square format) - both work perfectly!
- **Style**: Cute, colorful, child-friendly
- **File Size**: Keep under 200KB per image for optimal performance

## 🔍 Asset Categories

### Fruits
Used for counting activities and basic math lessons.
- apple_red.png
- apple_green.png
- banana.png
- orange.png
- strawberry.png
- mango.png

### Shapes
Used for geometry and pattern lessons.
- circle.png
- square.png
- triangle.png
- rectangle.png
- star.png
- heart.png

### Money
Used for Philippine Peso money lessons.
- coin_1peso.png
- coin_5peso.png
- coin_10peso.png
- bill_20peso.png
- bill_50peso.png

### Numbers
Used for number recognition activities.
- number_0.png through number_20.png

### Math Symbols
Used for addition, subtraction, and comparison activities.
- plus.png
- minus.png
- equals.png
- greater_than.png
- less_than.png

### Objects
Used for counting and collection activities.
- block.png
- basket.png
- box.png

### Measurement Tools
Used for measurement lessons.
- ruler.png
- scale.png
- clock.png

### Patterns
Used for pattern recognition activities.
- circle_red.png, circle_blue.png, circle_yellow.png, circle_green.png
- square_red.png, square_blue.png, square_yellow.png, square_green.png

### Rewards
Used for gamification and achievements.
- star_gold.png
- star_silver.png
- trophy.png

## 🚀 Quick Start

1. Generate assets using Canva AI (see `CANVA_AI_ASSET_GENERATION_PROMPT.md`)
2. Save PNG files in appropriate category folders
3. Update `mobile/src/data/sticker-assets.ts` with new assets
4. Test in the AssetPicker component

## 📝 Notes

- All assets are bundled with the app for offline use
- Assets are referenced by ID, not by file path
- The AssetPicker component handles all asset display logic
- Keep asset names consistent with the manifest

