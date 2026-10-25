import {useMemo} from 'react';
import {useWindowDimensions, PixelRatio} from 'react-native';

/** Design baseline (logical width / height from primary mock device). */
export const DESIGN_WIDTH = 375;
export const DESIGN_HEIGHT = 812;

function roundSize(n) {
  return Math.round(PixelRatio.roundToNearestPixel(n));
}

/** Scale layout size by window width (full proportional). */
export function scaleWidth(size, windowWidth, baseWidth = DESIGN_WIDTH) {
  return roundSize(size * (windowWidth / baseWidth));
}

/** Scale layout size by window height. */
export function scaleHeight(size, windowHeight, baseHeight = DESIGN_HEIGHT) {
  return roundSize(size * (windowHeight / baseHeight));
}

/**
 * Moderate scale — grows less aggressively on large phones / tablets.
 * Use for font sizes and touch targets.
 */
export function moderateScale(
  size,
  windowWidth,
  factor = 0.35,
  baseWidth = DESIGN_WIDTH,
) {
  const scaled = size * (windowWidth / baseWidth);
  return roundSize(size + (scaled - size) * factor);
}

/**
 * Font size: moderate width scale × clamped system fontScale (accessibility).
 */
export function scaleFont(
  size,
  windowWidth,
  fontScale = 1,
  factor = 0.35,
  baseWidth = DESIGN_WIDTH,
) {
  const base = moderateScale(size, windowWidth, factor, baseWidth);
  const fs = Math.min(Math.max(fontScale, 0.85), 1.25);
  return Math.max(10, Math.round(base * fs));
}

/**
 * Hook for consistent scaling across iOS / Android and different screen widths.
 * - `scaleW` / `scaleH`: layout pixels from design spec
 * - `ms`: “moderate” scale — good for fonts (does not grow as aggressively on tablets)
 */
export function useResponsiveMetrics(baseWidth = DESIGN_WIDTH) {
  const {width, height, fontScale} = useWindowDimensions();

  return useMemo(() => {
    const scaleW = size => scaleWidth(size, width, baseWidth);
    const scaleH = size => scaleHeight(size, height);
    const ms = (size, factor = 0.35) =>
      moderateScale(size, width, factor, baseWidth);
    const font = (size, factor = 0.35) =>
      scaleFont(size, width, fontScale, factor, baseWidth);

    return {
      width,
      height,
      fontScale,
      scaleW,
      scaleH,
      ms,
      font,
      widthPct: pct => (width * pct) / 100,
      isCompact: width < 360,
      isTablet: width >= 768,
    };
  }, [width, height, fontScale, baseWidth]);
}
