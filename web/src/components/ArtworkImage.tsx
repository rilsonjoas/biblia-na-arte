import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { isLocalAsset } from '@/lib/storage';

interface ArtworkImageProps {
  src?: string;
  alt: string;
  title?: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Smart image component that handles both Storage URLs and local assets
 * with fallback support and loading states
 */
export const ArtworkImage: React.FC<ArtworkImageProps> = ({
  src,
  alt,
  title,
  className,
  width,
  height,
  loading = 'lazy',
  fallbackSrc = '/placeholder-image.jpg',
  onLoad,
  onError,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    onLoad?.();
  };

  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      // Try fallback image
      setCurrentSrc(fallbackSrc);
      setImageError(false);
    } else {
      // Even fallback failed
      setImageError(true);
      setImageLoaded(false);
    }
    onError?.();
  };

  // If no src provided, use fallback
  const imageSrc = currentSrc || fallbackSrc;

  // Determine image source type for debugging/analytics
  const sourceType = isLocalAsset(imageSrc) ? 'local' : 'external';

  return (
    <div 
      className={cn(
        'relative overflow-hidden bg-muted',
        className
      )}
      data-image-source={sourceType}
    >
      {/* Loading skeleton */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}

      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <div className="text-center">
            <svg 
              className="mx-auto h-8 w-8 mb-2" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
            <p className="text-xs">Imagem não encontrada</p>
          </div>
        </div>
      )}

      {/* Main image */}
      <img
        src={imageSrc}
        alt={alt}
        title={title}
        width={width}
        height={height}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'object-cover transition-opacity duration-200',
          imageLoaded ? 'opacity-100' : 'opacity-0',
          imageError && 'hidden'
        )}
      />

      {/* Image overlay for additional info (dev mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-1 right-1">
          <span
            className={cn(
              'px-1 py-0.5 text-xs font-mono rounded',
              sourceType === 'local' && 'bg-yellow-500 text-black',
              sourceType === 'external' && 'bg-blue-500 text-white'
            )}
            title={`Image source: ${sourceType} (${imageSrc})`}
          >
            {sourceType === 'local' ? 'L' : 'E'}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Optimized artwork image component with responsive sizing
 */
export const ResponsiveArtworkImage: React.FC<ArtworkImageProps> = (props) => {
  return (
    <ArtworkImage
      {...props}
      className={cn(
        'w-full h-full aspect-square md:aspect-[4/3]',
        props.className
      )}
    />
  );
};

/**
 * Thumbnail version for lists and grids
 */
export const ArtworkThumbnail: React.FC<ArtworkImageProps> = (props) => {
  return (
    <ArtworkImage
      {...props}
      className={cn(
        'w-16 h-16 rounded-md',
        props.className
      )}
      loading="lazy"
    />
  );
};

/**
 * Hero image version for detail pages
 */
export const ArtworkHeroImage: React.FC<ArtworkImageProps> = (props) => {
  return (
    <ArtworkImage
      {...props}
      className={cn(
        'w-full max-h-[70vh] rounded-lg shadow-lg',
        props.className
      )}
      loading="eager"
    />
  );
};