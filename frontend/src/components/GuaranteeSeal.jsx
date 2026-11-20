import React from 'react';

/**
 * Crisp SVG 10-Year Mechanical Guarantee Seal
 * Matches the circular seal in the AASTRA brochure footer, rendered cleanly in grayscale or subtle brand gold.
 */
export default function GuaranteeSeal({ size = 48, accent = 'grayscale', className = '' }) {
  const strokeMain = accent === 'gold' ? '#9E7D17' : '#555555';
  const strokeLight = accent === 'gold' ? '#C9A227' : '#8A8D91';
  const textFill = accent === 'gold' ? '#6E5610' : '#333333';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-label="10 Year Mechanical Guarantee"
    >
      <defs>
        <path id="topArc" d="M 18,50 A 32,32 0 1,1 82,50" />
        <path id="bottomArc" d="M 84,54 A 34,34 0 0,1 16,54" />
      </defs>
      {/* Outer decorative double ring */}
      <circle cx="50" cy="50" r="46" fill="none" stroke={strokeMain} strokeWidth="1.6" />
      <circle cx="50" cy="50" r="42" fill="none" stroke={strokeLight} strokeWidth="0.9" strokeDasharray="2 1.5" />
      <circle cx="50" cy="50" r="24" fill="none" stroke={strokeLight} strokeWidth="1" />

      {/* Top curved label */}
      <text
        fill={textFill}
        fontSize="8.8"
        fontWeight="700"
        letterSpacing="1.3"
        fontFamily="Inter, Arial, sans-serif"
      >
        <textPath href="#topArc" startOffset="50%" textAnchor="middle">
          MECHANICAL
        </textPath>
      </text>

      {/* Center 10 */}
      <text
        x="50"
        y="53"
        textAnchor="middle"
        fill={textFill}
        fontSize="24"
        fontWeight="700"
        fontFamily="Georgia, serif"
      >
        10
      </text>
      <text
        x="50"
        y="64"
        textAnchor="middle"
        fill={strokeMain}
        fontSize="6.5"
        fontWeight="600"
        letterSpacing="1"
        fontFamily="Inter, Arial, sans-serif"
      >
        YEAR
      </text>

      {/* Bottom curved label */}
      <text
        fill={textFill}
        fontSize="8.5"
        fontWeight="700"
        letterSpacing="1.2"
        fontFamily="Inter, Arial, sans-serif"
      >
        <textPath href="#bottomArc" startOffset="50%" textAnchor="middle">
          GUARANTEE
        </textPath>
      </text>
    </svg>
  );
}
