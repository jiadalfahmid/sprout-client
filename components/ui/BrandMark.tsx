import React from 'react';

interface BrandMarkProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  variant?: 'color' | 'monochrome';
}

/**
 * BrandMark - The official Sprout brand symbol
 * A growing stem with caring leaves and a nested family heart.
 * Matches /public/favicon.svg and /public/icon-512.svg.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({
  size,
  className = 'w-6 h-6',
  variant = 'color',
  ...props
}) => {
  const uniqueId = React.useId().replace(/:/g, '');
  const leafGradId = `sproutLeafGrad_${uniqueId}`;
  const heartGradId = `sproutHeartGrad_${uniqueId}`;

  const style = size ? { width: size, height: size, ...props.style } : props.style;

  return (
    <svg
      viewBox="110 110 292 292"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      style={style}
      aria-label="Sprout Brand Mark"
      {...props}
    >
      <defs>
        <linearGradient id={leafGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id={heartGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>

      <g transform="translate(0, 10)">
        {/* Soil / Root Base Arc */}
        <path
          d="M156 380 C180 340 332 340 356 380 C310 405 202 405 156 380 Z"
          fill={variant === 'color' ? '#10B981' : 'currentColor'}
          fillOpacity={variant === 'color' ? 0.3 : 0.2}
        />

        {/* Central Growing Stem */}
        <path
          d="M256 370 C256 260 252 200 256 160"
          stroke={variant === 'color' ? '#059669' : 'currentColor'}
          strokeWidth="22"
          strokeLinecap="round"
        />

        {/* Right Vibrant Sprout Leaf */}
        <path
          d="M256 260 C290 260 370 240 380 170 C310 160 270 210 256 260 Z"
          fill={variant === 'color' ? `url(#${leafGradId})` : 'currentColor'}
          fillOpacity={variant === 'color' ? 1 : 0.85}
          stroke={variant === 'color' ? '#047857' : 'currentColor'}
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Left Caring Leaf */}
        <path
          d="M256 220 C220 220 142 195 132 125 C202 115 242 165 256 220 Z"
          fill={variant === 'color' ? '#6EE7B7' : 'currentColor'}
          fillOpacity={variant === 'color' ? 0.9 : 0.65}
          stroke={variant === 'color' ? '#059669' : 'currentColor'}
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Floating Family Heart Core */}
        <path
          d="M256 135 C248 120 226 116 216 130 C202 148 220 174 256 200 C292 174 310 148 296 130 C286 116 264 120 256 135 Z"
          fill={variant === 'color' ? `url(#${heartGradId})` : 'currentColor'}
          stroke={variant === 'color' ? '#DB2777' : 'currentColor'}
          strokeWidth="5"
        />
      </g>
    </svg>
  );
};

export default BrandMark;
