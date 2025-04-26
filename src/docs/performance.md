# Guide d'Optimisation des Performances - Mathildanesth

Ce document détaille les stratégies d'optimisation des performances mises en place dans l'application Mathildanesth, notamment pour les images et les assets.

## Images et Assets

### Composant OptimizedImage

Nous avons créé un composant `OptimizedImage` qui encapsule les meilleures pratiques pour les images :

```tsx
import { useState, useEffect } from 'react';
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
```

### Sprites SVG

Pour optimiser les icônes, nous avons mis en place un système de sprites SVG :

1. Toutes les icônes fréquemment utilisées sont regroupées dans un seul fichier SVG
2. Ce fichier est chargé une seule fois et mis en cache
3. Les icônes sont ensuite utilisées via des références

```tsx
// Composant Icon
import React from 'react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export const Icon = ({ name, size = 24, className }: IconProps) => {
  return (
    <svg width={size} height={size} className={className}>
      <use href={`/sprites.svg#${name}`} />
    </svg>
  );
};
```

### Script d'Optimisation Automatique

Nous avons créé un script npm qui optimise automatiquement les images :

```json
// package.json
{
  "scripts": {
    "optimize-images": "node scripts/optimize-images.js"
  }
}
```

Le script utilise Sharp pour :
1. Redimensionner les images (plusieurs tailles pour différents appareils)
2. Convertir les images en formats modernes (WebP, AVIF)
3. Compresser les images sans perte de qualité significative
4. Générer des placeholders pour le chargement progressif

### Configuration de Next.js

Nous avons configuré Next.js pour optimiser les images :

```js
// next.config.js
module.exports = {
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['mathildanesth.fr'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  // Autres configurations...
};
```

## Optimisations des Composants

### Memoïsation des Composants

Nous avons utilisé `React.memo` pour les composants qui reçoivent souvent les mêmes props :

```tsx
import React from 'react';

interface UserCardProps {
  name: string;
  role: string;
  avatar: string;
}

const UserCard = React.memo(({ name, role, avatar }: UserCardProps) => {
  return (
    <div className="user-card">
      <OptimizedImage src={avatar} alt={name} width={50} height={50} />
      <div>
        <h3>{name}</h3>
        <p>{role}</p>
      </div>
    </div>
  );
});

UserCard.displayName = 'UserCard';

export default UserCard;
```

### Hooks useMemo et useCallback

Nous utilisons `useMemo` et `useCallback` pour éviter les recalculs et recréations de fonctions :

```tsx
import { useMemo, useCallback } from 'react';

const Component = ({ items, onSelect }) => {
  // Mémoisation des données transformées
  const processedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      fullName: `${item.firstName} ${item.lastName}`,
    }));
  }, [items]);

  // Mémoisation des handlers d'événements
  const handleSelect = useCallback((id) => {
    onSelect(id);
  }, [onSelect]);

  return (
    // ...
  );
};
```

### Code-Splitting et Lazy Loading

Nous utilisons le chargement dynamique pour les composants lourds :

```tsx
import dynamic from 'next/dynamic';

const DynamicCalendar = dynamic(() => import('../components/Calendar'), {
  ssr: false,
  loading: () => <p>Chargement du calendrier...</p>
});
```

## Optimisation du Chargement des Ressources

### Preloading et Prefetching

Nous utilisons `<link rel="preload">` pour les ressources critiques et `<link rel="prefetch">` pour les ressources qui seront probablement nécessaires :

```tsx
// _document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="preload" href="/fonts/Inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/sprites.svg" as="image" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

### Cache Control

Nous avons mis en place des stratégies de cache pour les ressources statiques :

```js
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

module.exports = withBundleAnalyzer({
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ],
      },
    ];
  },
  // Autres configurations...
});
```

## Mesure et Surveillance des Performances

### Lighthouse CI

Nous avons intégré Lighthouse CI pour surveiller les performances de l'application :

```json
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/'],
      numberOfRuns: 3,
    },
    upload: {
      target: 'temporary-public-storage',
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
      },
    },
  },
};
```

### Web Vitals

Nous surveillons les Web Vitals en production :

```tsx
// pages/_app.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import * as gtag from '../lib/gtag';
import { reportWebVitals } from 'next/web-vitals';

export function reportWebVitals(metric) {
  // Envoyer les métriques à notre service d'analytics
  console.log(metric);
}

function MyApp({ Component, pageProps }) {
  // ...
  return <Component {...pageProps} />;
}

export default MyApp;
```

## Bonnes Pratiques pour le Développement

1. **Analyser les bundles** : Utiliser `next-bundle-analyzer` pour identifier les modules lourds
2. **Optimiser les dépendances** : Minimiser les dépendances externes et préférer les solutions natives
3. **État local** : Préférer l'état local au state management global quand c'est possible
4. **Données statiques** : Utiliser `getStaticProps` et `getStaticPaths` quand le contenu est statique
5. **Requêtes API** : Utiliser SWR ou React Query pour la mise en cache et la revalidation

## Utilisation des Optimisations

Pour utiliser ces optimisations dans vos développements :

1. Utilisez le composant `<OptimizedImage>` au lieu de `<img>` ou `<Image>` directement
2. Utilisez le composant `<Icon>` pour les icônes au lieu d'importer des SVG individuels
3. Exécutez `npm run optimize-images` après avoir ajouté de nouvelles images
4. Utilisez `React.memo`, `useMemo` et `useCallback` de manière judicieuse
5. Implémenter le lazy loading pour les composants et ressources non critiques

## Prochaines Étapes

Les futures optimisations incluront :

1. Implémenter un service worker pour le mode hors-ligne
2. Optimiser les polices de caractères (font-display, subsetting)
3. Mettre en place un CDN pour les ressources statiques
4. Implémenter une stratégie de streaming SSR
5. Optimiser le First Input Delay (FID) et Interaction to Next Paint (INP)

---

Dernière mise à jour : Avril 2025 