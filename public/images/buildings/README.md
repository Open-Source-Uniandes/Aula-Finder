# Building Images

This directory contains images for university buildings used in the AulaFinder app.

## Image Requirements
- Format: JPG or PNG
- Recommended size: 800x600px or similar aspect ratio
- Optimized for web (compressed)

## Sources
Images should be sourced by searching:
1. "edificio [CODE] uniandes" for specific buildings
2. "campus uniandes" for fallback images

## Current Images
- `campus-uniandes.jpg` - Fallback image for all buildings
- Individual building images can be added with naming: `[building-code]-building.jpg`

## Adding New Images
1. Search for high-quality images of the building
2. Optimize and compress the image
3. Save with naming convention: `[code]-building.jpg` (e.g., `ml-building.jpg`)
4. Update `buildingPriority.json` to reference the new image
