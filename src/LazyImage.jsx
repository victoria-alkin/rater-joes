import { useState, useRef, useEffect } from 'react';

export default function LazyImage({
  src,
  alt,
  className = "",
  placeholder = "🛒",
  thumbnailSrc = null, // Low-res thumbnail URL
  onLoad,
  onError,
  onClick,
  priority = false, // Skip lazy loading for above-the-fold images
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const containerRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (priority) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (containerRef.current) {
            observerRef.current.unobserve(containerRef.current);
          }
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observerRef.current.observe(containerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setHasError(true);
    if (onError) onError();
  };

  const handleThumbnailLoad = () => {
    setThumbnailLoaded(true);
  };

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  // Show placeholder until we have either a thumbnail or the full image loaded
  const showPlaceholder = !isInView || (!thumbnailLoaded && !isLoaded) || hasError;

  return (
    <div ref={containerRef} className={`lazy-image-container ${className}`} style={{minHeight:0}}>
      {/* Loading placeholder - stays until we have content */}
      {showPlaceholder && (
        <div className="absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center animate-pulse z-10">
          <div className="text-4xl opacity-50">{placeholder}</div>
        </div>
      )}

      {/* Error placeholder */}
      {hasError && (
        <div className="absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="text-4xl mb-2">📷</div>
            <div className="text-sm text-gray-500">Image unavailable</div>
          </div>
        </div>
      )}

      {/* Images (only render when in view and not error) */}
      {isInView && !hasError && (
        <>
          {/* Thumbnail (low-res) - loads first, only shown if we're also loading a higher-res src */}
          {thumbnailSrc && thumbnailSrc !== src && (
            <img
              src={thumbnailSrc}
              alt={alt}
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                opacity: thumbnailLoaded ? 1 : 0,
                zIndex: 1,
              }}
              onLoad={handleThumbnailLoad}
              onError={() => setThumbnailLoaded(false)}
              onClick={handleClick}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
            />
          )}

          {/* Main image */}
          <img
            src={src}
            alt={alt}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: isLoaded ? 1 : 0,
              zIndex: 2,
            }}
            onLoad={handleLoad}
            onError={handleError}
            onClick={handleClick}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchpriority={priority ? "high" : "auto"}
          />
        </>
      )}
    </div>
  );
} 