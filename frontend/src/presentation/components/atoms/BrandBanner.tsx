import React from 'react';

interface BrandBannerProps {
  className?: string;
  alt?: string;
}

export const BrandBanner: React.FC<BrandBannerProps> = ({
  className = '',
  alt = 'GREENFIELD — Solana USDC Developer Rewards Banner',
}) => {
  return (
    <div
      className={`relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden border border-[#145907] shadow-2xl shadow-[#145907]/20 group transition-all duration-300 hover:border-[#28B110]/50 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#1B1E1A]/60 via-transparent to-transparent pointer-events-none z-10" />
      <img
        src="/Icon-banner.png"
        alt={alt}
        className="w-full h-auto object-cover transform group-hover:scale-[1.01] transition-transform duration-500"
      />
    </div>
  );
};

export default BrandBanner;
