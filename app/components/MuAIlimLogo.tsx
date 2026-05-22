/**
 * MuAIlimLogo
 * Renders the brand logo: "Mu" + gradient "AI" + "lim"
 * "AI" has a left→right gradient: light-blue (#A8C8FF) → purple (#9B8EF4)
 * matching the brand identity.
 *
 * Usage:
 *   <MuAIlimLogo size="large" />   // 42px font, ~270×52px
 *   <MuAIlimLogo size="medium" />  // 30px font  (default)
 *   <MuAIlimLogo size="small" />   // 20px font
 *   <MuAIlimLogo fontSize={28} />  // exact px override
 */

import Svg, {
  Text as SvgText,
  TSpan,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

// Brand colours ──────────────────────────────────────────────────────────────
const DARK = '#1B2645';       // "Mu" and "lim" — dark navy matching the logo
const GRAD_START = '#A8C8FF'; // "A"  — light sky blue
const GRAD_END   = '#9B8EF4'; // "I"  — lavender-purple

// The gradient id must be unique per instance; use a module-level constant
// (safe because there will only ever be one logo on screen at a time).
const GRAD_ID = 'muaillimAiGrad';

// Per-size configs ────────────────────────────────────────────────────────────
type SizeName = 'small' | 'medium' | 'large';

const SIZE_MAP: Record<SizeName, number> = {
  small:  20,
  medium: 30,
  large:  42,
};

interface Props {
  size?: SizeName;
  fontSize?: number; // overrides size
}

export default function MuAIlimLogo({ size = 'medium', fontSize: fontSizeProp }: Props) {
  const fontSize = fontSizeProp ?? SIZE_MAP[size];

  // Approximate SVG canvas — wide enough for "MuAIlim" at this font size.
  // letterSpacing ≈ -0.5 is baked in visually; we add a small pad on each side.
  // Character width is ~0.58 × fontSize for this rounded sans font.
  const charW   = fontSize * 0.60;
  const svgW    = Math.ceil(charW * 7 + fontSize * 0.4); // 7 chars + small pad
  const svgH    = Math.ceil(fontSize * 1.28);
  const baseline = Math.ceil(fontSize * 1.0);

  return (
    <Svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      accessible
      accessibilityLabel="MuAIlim"
    >
      <Defs>
        <LinearGradient id={GRAD_ID} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0"   stopColor={GRAD_START} stopOpacity="1" />
          <Stop offset="1"   stopColor={GRAD_END}   stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/*
        TSpan lets us mix fills inside a single Text element so characters
        sit exactly next to each other with no layout gap.
      */}
      <SvgText
        y={baseline}
        fontSize={fontSize}
        fontWeight="700"
        letterSpacing={-0.5}
      >
        <TSpan fill={DARK}>Mu</TSpan>
        <TSpan fill={`url(#${GRAD_ID})`}>AI</TSpan>
        <TSpan fill={DARK}>lim</TSpan>
      </SvgText>
    </Svg>
  );
}
