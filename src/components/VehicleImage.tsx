import { useState } from 'react';
import { Car } from 'lucide-react';

interface VehicleImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function VehicleImage({ src, alt, className = '' }: VehicleImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-slate-400 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Car className="w-9 h-9 stroke-[1.5] text-slate-400" />
        <span className="mt-2 text-xs font-medium text-slate-500 px-3 text-center truncate max-w-full">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
