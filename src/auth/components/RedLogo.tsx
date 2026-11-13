import React from 'react';

interface RedLogoProps {
  className?: string;
  variant?: 'white' | 'color';
  size?: 'sm' | 'md' | 'lg';
}

export const RedLogo: React.FC<RedLogoProps> = ({
  className = '',
  variant = 'color',
  size = 'md',
}) => {
  const isColor = variant === 'color';

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Logotipo Red Movilidad */}
      <div className="flex items-center">
        <span
          className={`font-black tracking-tight lowercase leading-none ${
            isColor ? 'text-[#E30613]' : 'text-white'
          } ${size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-3xl' : 'text-2xl'}`}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          red
        </span>
        <span
          className={`font-bold uppercase tracking-wider ml-1.5 ${
            isColor ? 'text-slate-800' : 'text-white'
          } ${size === 'lg' ? 'text-lg' : size === 'md' ? 'text-base' : 'text-xs'}`}
        >
          movilidad
        </span>
      </div>

      {/* Punto indicador rojo/blanco */}
      <div
        className={`w-2 h-2 rounded-full ${
          isColor ? 'bg-[#E30613]' : 'bg-white'
        }`}
        aria-hidden="true"
      />
    </div>
  );
};
