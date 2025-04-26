import { useState } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    priority?: boolean;
    className?: string;
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

/**
 * Composant d'image optimisé qui utilise next/image avec lazy loading
 * et formats modernes par défaut.
 */
export const OptimizedImage = ({
    src,
    alt,
    width,
    height,
    priority = false,
    className,
    objectFit = 'cover',
}: OptimizedImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className={`image-container ${isLoaded ? 'loaded' : 'loading'}`}>
            <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                priority={priority}
                className={className}
                style={{ objectFit }}
                loading={priority ? 'eager' : 'lazy'}
                onLoad={() => setIsLoaded(true)}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            />
        </div>
    );
};

export default OptimizedImage; 