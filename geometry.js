export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function computeScaledDimensions(naturalWidth, naturalHeight, scale) {
  return {
    width: Math.round(naturalWidth * scale),
    height: Math.round(naturalHeight * scale),
  };
}

export function displayToLogicalScale(displayWidth, logicalWidth) {
  return displayWidth / logicalWidth;
}

export function displayDeltaToLogicalDelta(deltaDisplayPx, displayScale) {
  return deltaDisplayPx / displayScale;
}

export function centerPoint(width, height) {
  return { x: width / 2, y: height / 2 };
}
