'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

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

export function UniversalSearch() {
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

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Failed to search');
      }

      const data = await response.json();
      
      // Group results by type
      const groupedResults: Record<string, SearchResult[]> = {};
      
      data.results.forEach((result: any) => {
        const type = result.type;
        if (!groupedResults[type]) {
          groupedResults[type] = [];
        }
        
        // Transform result based on type
        let searchResult: SearchResult;
        
        switch (type) {
          case 'user':
            searchResult = {
              id: result.id,
              type: 'user',
              title: result.name,
              subtitle: result.email,
              description: result.role,
              icon: <Users className="h-4 w-4" />,
              link: `/utilisateurs/${result.id}`,
              metadata: result,
              score: result.score
            };
            break;
            
          case 'leave':
            searchResult = {
              id: result.id,
              type: 'leave',
              title: `Congé de ${result.userName}`,
              subtitle: `${result.startDate} - ${result.endDate}`,
              description: result.type,
              icon: <Calendar className="h-4 w-4" />,
              link: `/conges/${result.id}`,
              metadata: result,
              score: result.score
            };
            break;
            
          case 'planning':
            searchResult = {
              id: result.id,
              type: 'planning',
              title: result.title,
              subtitle: result.date,
              description: result.location,
              icon: <Clock className="h-4 w-4" />,
              link: `/planning/${result.id}`,
              metadata: result,
              score: result.score
            };
            break;
            
          case 'surgeon':
            searchResult = {
              id: result.id,
              type: 'surgeon',
              title: result.name,
              subtitle: result.specialties?.join(', '),
              description: result.sites?.join(', '),
              icon: <Briefcase className="h-4 w-4" />,
              link: `/parametres/chirurgiens/${result.id}`,
              metadata: result,
              score: result.score
            };
            break;
            
          case 'site':
            searchResult = {
              id: result.id,
              type: 'site',
              title: result.name,
              subtitle: result.address,
              description: `${result.roomsCount} salles`,
              icon: <Building className="h-4 w-4" />,
              link: `/parametres/sites/${result.id}`,
              metadata: result,
              score: result.score
            };
            break;
            
          default:
            searchResult = {
              id: result.id,
              type: 'document',
              title: result.title,
              subtitle: result.path,
              description: result.excerpt,
              icon: <FileText className="h-4 w-4" />,
              link: result.link || '#',
              metadata: result,
              score: result.score
            };
        }
        
        groupedResults[type].push(searchResult);
      });
      
      // Convert to sections and sort by score
      const sections: SearchSection[] = Object.entries(groupedResults).map(([type, results]) => ({
        title: getSectionTitle(type),
        results: results.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5)
      }));
      
      setResults(sections);
    } catch (err) {
      console.error('Search error:', err);
      setError('Erreur lors de la recherche');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mock search for development
  useEffect(() => {
    if (debouncedQuery) {
      // For now, use mock data
      const mockResults: SearchSection[] = [
        {
          title: 'Utilisateurs',
          results: [
            {
              id: '1',
              type: 'user',
              title: 'Dr. Marie Dupont',
              subtitle: 'marie.dupont@hospital.fr',
              description: 'Anesthésiste MAR',
              icon: <Users className="h-4 w-4" />,
              link: '/utilisateurs/1',
              score: 0.9
            },
            {
              id: '2',
              type: 'user',
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
              type: 'leave',
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
              type: 'surgeon',
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

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        className="relative h-9 w-9 md:w-auto md:justify-start md:px-3 md:py-2"
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline-flex">Rechercher...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)}>
      <div 
        className="fixed left-1/2 top-20 w-full max-w-2xl -translate-x-1/2 px-4"
        onClick={e => e.stopPropagation()}
      >
        <Card className="overflow-hidden shadow-2xl">
          <div className="border-b">
            <div className="flex items-center px-4">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Rechercher des utilisateurs, congés, planning..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 border-0 px-4 py-4 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-0"
              />
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {results.length > 0 && (
            <div 
              ref={resultsRef}
              className="max-h-[400px] overflow-y-auto p-2"
            >
              {results.map((section, sectionIndex) => (
                <div key={section.title} className={sectionIndex > 0 ? 'mt-4' : ''}>
                  <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.results.map((result, resultIndex) => {
                      const globalIndex = results
                        .slice(0, sectionIndex)
                        .reduce((acc, s) => acc + s.results.length, 0) + resultIndex;
                      
                      return (
                        <button
                          key={result.id}
                          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                            selectedIndex === globalIndex
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-accent/50'
                          }`}
                          onClick={() => handleSelect(result)}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                            {result.icon}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{result.title}</span>
                              {result.score && result.score > 0.8 && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Pertinent
                                </Badge>
                              )}
                            </div>
                            {result.subtitle && (
                              <div className="text-sm text-muted-foreground">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {query && !isLoading && results.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Aucun résultat pour "{query}"
            </div>
          )}

          {!query && (
            <div className="p-4">
              <p className="text-center text-sm text-muted-foreground">
                Commencez à taper pour rechercher
              </p>
              <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <kbd className="rounded border bg-muted px-1">↑</kbd>
                  <kbd className="rounded border bg-muted px-1">↓</kbd>
                  <span>pour naviguer</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="rounded border bg-muted px-1">⏎</kbd>
                  <span>pour sélectionner</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="rounded border bg-muted px-1">esc</kbd>
                  <span>pour fermer</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}