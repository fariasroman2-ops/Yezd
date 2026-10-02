import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withContainer?: boolean;
}

/**
 * BrandLogo: Renders the geometric winged falcon / Y emblem 
 * in brand pink (#FF17C1) with solid black background (#000000).
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = '', 
  size = 'md',
  withContainer = true 
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const containerClasses = withContainer 
    ? `${sizeMap[size]} rounded-2xl bg-black border border-pink-500/30 flex items-center justify-center p-1.5 shadow-md shadow-[#FF17C1]/20 transition-transform group-hover:scale-105 ${className}`
    : `${sizeMap[size]} ${className}`;

  return (
    <div className={containerClasses} title="InverTrack AI">
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Linear gradient for high-shine pink facets */}
          <linearGradient id="pinkFacetMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFA6E8" />
            <stop offset="50%" stopColor="#FF17C1" />
            <stop offset="100%" stopColor="#D9048E" />
          </linearGradient>

          {/* Darker shaded magenta facet for isometric bevel */}
          <linearGradient id="pinkFacetShade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF17C1" />
            <stop offset="100%" stopColor="#9E0266" />
          </linearGradient>

          {/* Crisp highlight edge */}
          <linearGradient id="pinkFacetLight" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF47D1" />
            <stop offset="100%" stopColor="#FFD1F5" />
          </linearGradient>
        </defs>

        {/* --- GEOMETRIC WINGED MONOGRAM (PINK ON BLACK) --- */}
        
        {/* Upper Left Wing - Top Facet */}
        <polygon 
          points="33,37 49,37 68,48 55,50" 
          fill="url(#pinkFacetLight)" 
        />
        {/* Upper Left Wing - Lower Slanted Blade */}
        <polygon 
          points="33,37 55,50 48,51 38,42" 
          fill="url(#pinkFacetShade)" 
        />

        {/* Upper Right Wing - Top Facet */}
        <polygon 
          points="67,37 51,37 32,48 45,50" 
          fill="url(#pinkFacetLight)" 
        />
        {/* Upper Right Wing - Lower Slanted Blade */}
        <polygon 
          points="67,37 45,50 52,51 62,42" 
          fill="url(#pinkFacetMain)" 
        />

        {/* Lower Left Fold Blade */}
        <polygon 
          points="38,44 48,51 40,51" 
          fill="url(#pinkFacetShade)" 
        />
        
        {/* Lower Right Fold Blade */}
        <polygon 
          points="62,44 52,51 60,51" 
          fill="url(#pinkFacetLight)" 
        />

        {/* Center Diagonal Strut - Left to Center Lower */}
        <polygon 
          points="40,51 49,55 53,52 48,51" 
          fill="url(#pinkFacetMain)" 
        />

        {/* Center Diagonal Overlap - Right to Center Lower */}
        <polygon 
          points="60,51 51,55 47,52 52,51" 
          fill="url(#pinkFacetLight)" 
        />

        {/* Center Lower Body / Stem - Left Facet */}
        <polygon 
          points="47,52 50,54 50,65 47,62" 
          fill="url(#pinkFacetShade)" 
        />

        {/* Center Lower Body / Stem - Right Facet */}
        <polygon 
          points="50,54 53,52 53,62 50,65" 
          fill="url(#pinkFacetMain)" 
        />

        {/* Stem Point / Chisel Bottom Tip */}
        <polygon 
          points="47,62 50,65 50,66 48,64" 
          fill="#830255" 
        />
        <polygon 
          points="53,62 50,65 50,66 52,64" 
          fill="url(#pinkFacetLight)" 
        />
      </svg>
    </div>
  );
};
