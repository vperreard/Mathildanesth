'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Users,
  Calendar,
  Clock,
  FileText,
  Building,
  Briefcase,
  X,
  Command,
  ArrowRight,
  Loader2,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
  id: string;
  type: 'user' | 'leave' | 'planning' | 'surgeon' | 'site' | 'document';
  title: string;
  subtitle?: string;
  description?: string;
  icon: React.ReactNode;
  link: string;
  metadata?: Record<string, any>;
  score?: number;
}

interface SearchSection {
  title: string;
  results: SearchResult[];
}

interface UniversalSearchProps {
  compact?: boolean;
  className?: string;
}

export function UniversalSearch({ compact = false, className = '' }: UniversalSearchProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchSection[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const debouncedQuery = useDebounce(query, 300);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Mock search for development
  useEffect(() => {
    if (debouncedQuery) {
      setIsLoading(true);
      // For now, use mock data
      setTimeout(() => {
        const mockResults: SearchSection[] = [
          {
            title: 'Utilisateurs',
            results: [
              {
                id: '1',
                type: 'user' as const,
                title: 'Dr. Marie Dupont',
                subtitle: 'marie.dupont@hospital.fr',
                description: 'Anesthésiste MAR',
                icon: <Users className="h-4 w-4" />,
                link: '/utilisateurs/1',
                score: 0.9
              },
              {
                id: '2',
                type: 'user' as const,
                title: 'Jean Martin',
                subtitle: 'jean.martin@hospital.fr',
                description: 'IADE',
                icon: <Users className="h-4 w-4" />,
                link: '/utilisateurs/2',
                score: 0.8
              }
            ].filter(r => r.title.toLowerCase().includes(debouncedQuery.toLowerCase()))
          },
          {
            title: 'Congés',
            results: [
              {
                id: '3',
                type: 'leave' as const,
                title: 'Congé de Marie Dupont',
                subtitle: '15/06/2025 - 22/06/2025',
                description: 'Congé annuel',
                icon: <Calendar className="h-4 w-4" />,
                link: '/conges/3',
                score: 0.7
              }
            ].filter(r => r.title.toLowerCase().includes(debouncedQuery.toLowerCase()))
          },
          {
            title: 'Chirurgiens',
            results: [
              {
                id: '4',
                type: 'surgeon' as const,
                title: 'Dr. Pierre Lefevre',
                subtitle: 'Orthopédie, Traumatologie',
                description: 'Hôpital Central, Clinique Sud',
                icon: <Briefcase className="h-4 w-4" />,
                link: '/parametres/chirurgiens/4',
                score: 0.85
              }
            ].filter(r => r.title.toLowerCase().includes(debouncedQuery.toLowerCase()))
          }
        ].filter(section => section.results.length > 0);

        setResults(mockResults);
        setIsLoading(false);
      }, 200);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const getSectionTitle = (type: string): string => {
    const titles: Record<string, string> = {
      user: 'Utilisateurs',
      leave: 'Congés',
      planning: 'Planning',
      surgeon: 'Chirurgiens',
      site: 'Sites',
      document: 'Documents'
    };
    return titles[type] || 'Autres';
  };

  const handleSelect = (result: SearchResult) => {
    router.push(result.link);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const allResults = results.flatMap(section => section.results);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (allResults[selectedIndex]) {
          handleSelect(allResults[selectedIndex]);
        }
        break;
    }
  };

  const getIconColor = (type: string) => {
    const colors: Record<string, string> = {
      user: 'text-blue-500',
      leave: 'text-green-500',
      planning: 'text-purple-500',
      surgeon: 'text-orange-500',
      site: 'text-pink-500',
      document: 'text-gray-500'
    };
    return colors[type] || 'text-gray-500';
  };

  const getIconBg = (type: string) => {
    const colors: Record<string, string> = {
      user: 'bg-blue-50 dark:bg-blue-950',
      leave: 'bg-green-50 dark:bg-green-950',
      planning: 'bg-purple-50 dark:bg-purple-950',
      surgeon: 'bg-orange-50 dark:bg-orange-950',
      site: 'bg-pink-50 dark:bg-pink-950',
      document: 'bg-gray-50 dark:bg-gray-950'
    };
    return colors[type] || 'bg-gray-50 dark:bg-gray-950';
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        className={`relative transition-colors ${compact
          ? 'h-8 w-8 p-0'
          : 'h-9 px-3 gap-2 text-sm font-normal text-muted-foreground hover:text-foreground'
          } ${className}`}
        onClick={() => setIsOpen(true)}
        title={compact ? 'Rechercher (⌘K)' : undefined}
      >
        <Search className={compact ? 'h-4 w-4' : 'h-4 w-4'} />
        {!compact && (
          <>
            <span className="hidden lg:inline">Rechercher...</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground lg:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </>
        )}
      </Button>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setIsOpen(false);
              setQuery('');
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.2, ease: [0.36, 0.66, 0.04, 1] }}
            className="fixed left-1/2 top-24 z-50 w-full max-w-2xl -translate-x-1/2 px-4"
            onClick={e => e.stopPropagation()}
          >
            <Card className="overflow-hidden border-0 shadow-2xl bg-white/98 dark:bg-gray-900/98 backdrop-blur-xl">
              <div className="border-b bg-gray-50/80 dark:bg-gray-800/80">
                <div className="flex items-center px-4 gap-3">
                  <div className="flex items-center justify-center">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Rechercher des utilisateurs, congés, planning..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 border-0 bg-transparent px-0 py-4 text-base placeholder:text-gray-400 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <div className="flex items-center gap-2">
                    {isLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    )}
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400">
                  {error}
                </div>
              )}

              {results.length > 0 && (
                <ScrollArea className="max-h-[450px]">
                  <div className="p-2">
                    {results.map((section, sectionIndex) => (
                      <div key={section.title} className={sectionIndex > 0 ? 'mt-4' : ''}>
                        <div className="mb-2 px-3 py-1">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            {section.title}
                          </h3>
                        </div>
                        <div className="space-y-1">
                          {section.results.map((result, resultIndex) => {
                            const globalIndex = results
                              .slice(0, sectionIndex)
                              .reduce((acc, s) => acc + s.results.length, 0) + resultIndex;

                            return (
                              <motion.button
                                key={result.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: globalIndex * 0.02 }}
                                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${selectedIndex === globalIndex
                                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                  }`}
                                onClick={() => handleSelect(result)}
                              >
                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getIconBg(result.type)} ${getIconColor(result.type)} transition-all group-hover:scale-110`}>
                                  {result.icon}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                      {result.title}
                                    </span>
                                    {result.score && result.score > 0.8 && (
                                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium">
                                        <Sparkles className="mr-0.5 h-2.5 w-2.5" />
                                        Pertinent
                                      </Badge>
                                    )}
                                  </div>
                                  {result.subtitle && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                      {result.subtitle}
                                    </div>
                                  )}
                                  {result.description && (
                                    <div className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5">
                                      {result.description}
                                    </div>
                                  )}
                                </div>
                                <ArrowRight className={`h-4 w-4 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-gray-500 ${selectedIndex === globalIndex ? 'text-primary' : ''
                                  }`} />
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {query && !isLoading && results.length === 0 && (
                <div className="p-12 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <Search className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Aucun résultat trouvé
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Nous n'avons trouvé aucun résultat pour "{query}"
                  </p>
                </div>
              )}

              {!query && (
                <div className="p-8 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    Recherche rapide
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Commencez à taper pour rechercher dans toute l'application
                  </p>

                  <div className="mt-6 flex items-center justify-center gap-6 text-xs">
                    <div className="flex items-center gap-2 text-gray-400">
                      <kbd className="rounded border border-gray-200 bg-white px-2 py-1 font-mono text-[10px] shadow-sm dark:border-gray-700 dark:bg-gray-800">↑</kbd>
                      <kbd className="rounded border border-gray-200 bg-white px-2 py-1 font-mono text-[10px] shadow-sm dark:border-gray-700 dark:bg-gray-800">↓</kbd>
                      <span>naviguer</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <kbd className="rounded border border-gray-200 bg-white px-2 py-1 font-mono text-[10px] shadow-sm dark:border-gray-700 dark:bg-gray-800">↵</kbd>
                      <span>sélectionner</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <kbd className="rounded border border-gray-200 bg-white px-2 py-1 font-mono text-[10px] shadow-sm dark:border-gray-700 dark:bg-gray-800">esc</kbd>
                      <span>fermer</span>
                    </div>
                  </div>

                  {/* Suggestions de recherche */}
                  <div className="mt-6 border-t pt-6">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Suggestions populaires
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['Congés en attente', 'Planning cette semaine', 'Utilisateurs actifs', 'Dernières modifications'].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setQuery(suggestion)}
                          className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <TrendingUp className="h-3 w-3" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}