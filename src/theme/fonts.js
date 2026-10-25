/**
 * PostScript names must match linked font files (see `ios/reparv/Info.plist` UIAppFonts).
 * Avoid `Inter-*`, `Segoe UI` (with space), and `SegoeUI-Semibold` — those files are not bundled.
 */
export const Fonts = {
  regular: 'SegoeUI-Regular',
  bold: 'SegoeUI-Bold',
  italic: 'SegoeUI-Italic',
  boldItalic: 'SegoeUI-BoldItalic',
  /** No Semibold TTF in repo; use bold for UI emphasis */
  semibold: 'SegoeUI-Bold',
};

export default Fonts;
