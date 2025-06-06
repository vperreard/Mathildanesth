'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  Clock, 
  Users, 
  Scale, 
  Calendar,
  ChevronRight,
  Search
} from 'lucide-react';
import { RuleTemplate } from '../types/ruleV2.types';
import { useQuery } from '@tanstack/react-query';

interface RuleTemplatesProps {
  onSelectTemplate: (template: RuleTemplate, parameters?: Record<string, unknown>) => void;
}

export const RuleTemplates: React.FC<RuleTemplatesProps> = ({ onSelectTemplate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<RuleTemplate | null>(null);
  const [parameters, setParameters] = useState<Record<string, unknown>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Fetch templates
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['rule-templates', selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      
      const response = await fetch(`http://localhost:3000/api/admin/rules/v2/templates?${params}`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    }
  });

  const getIconForTemplate = (templateId: string) => {
    const icons: Record<string, React.ReactNode> = {
      'max-guards-week': <Shield className="w-6 h-6" />,
      'rest-after-guard': <Clock className="w-6 h-6" />,
      'min-senior-per-shift': <Users className="w-6 h-6" />,
      'workload-balance': <Scale className="w-6 h-6" />,
      'leave-conflict-prevention': <Calendar className="w-6 h-6" />
    };
    return icons[templateId] || <Shield className="w-6 h-6" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Charge de travail': 'bg-blue-500',
      'Repos et récupération': 'bg-green-500',
      'Supervision': 'bg-purple-500',
      'Équité': 'bg-orange-500',
      'Congés': 'bg-pink-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const filteredTemplates = templatesData?.templates?.filter((template: RuleTemplate) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.category.toLowerCase().includes(query)
    );
  }) || [];

  const handleParameterChange = (paramName: string, value: unknown) => {
    setParameters(prev => ({ ...prev, [paramName]: value }));
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      // Apply default values for missing parameters
      const finalParameters = { ...parameters };
      selectedTemplate.parameters.forEach(param => {
        if (!(param.name in finalParameters) && param.default !== undefined) {
          finalParameters[param.name] = param.default;
        }
      });
      
      onSelectTemplate(selectedTemplate, finalParameters);
      setSelectedTemplate(null);
      setParameters({});
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-12 w-12 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher un template..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Toutes les catégories</SelectItem>
            {templatesData?.categories?.map((category: string) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Modèles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template: RuleTemplate) => (
          <Card 
            key={template.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedTemplate(template)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${getCategoryColor(template.category)} text-white`}>
                  {getIconForTemplate(template.id)}
                </div>
                <Badge variant="outline">{template.category}</Badge>
              </div>
              <CardTitle className="mt-4">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {template.parameters.length} paramètre{template.parameters.length > 1 ? 's' : ''} configurables
                </p>
                {template.examples.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {template.examples.length} exemple{template.examples.length > 1 ? 's' : ''} disponible{template.examples.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <Button 
                variant="ghost" 
                className="w-full mt-4"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTemplate(template);
                }}
              >
                Utiliser ce template
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Parameter Configuration Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed inset-x-4 top-[10%] max-w-2xl mx-auto bg-background border rounded-lg shadow-lg max-h-[80vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Configurer le template</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{selectedTemplate.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                </div>

                {/* Parameters */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium">Paramètres</h4>
                  {selectedTemplate.parameters.map(param => (
                    <div key={param.name} className="space-y-2">
                      <Label htmlFor={param.name}>
                        {param.label}
                        {param.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {param.description && (
                        <p className="text-sm text-muted-foreground">{param.description}</p>
                      )}
                      
                      {param.type === 'select' ? (
                        <Select
                          value={parameters[param.name] || param.default || ''}
                          onValueChange={(value) => handleParameterChange(param.name, value)}
                        >
                          <SelectTrigger id={param.name}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {param.options?.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : param.type === 'number' ? (
                        <Input
                          id={param.name}
                          type="number"
                          value={parameters[param.name] || param.default || ''}
                          onChange={(e) => handleParameterChange(param.name, parseInt(e.target.value))}
                          min={param.validation?.min}
                          max={param.validation?.max}
                        />
                      ) : (
                        <Input
                          id={param.name}
                          type="text"
                          value={parameters[param.name] || param.default || ''}
                          onChange={(e) => handleParameterChange(param.name, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Examples */}
                {selectedTemplate.examples.length > 0 && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">Exemples</h4>
                    {selectedTemplate.examples.map((example, idx) => (
                      <Card key={idx}>
                        <CardContent className="pt-4">
                          <h5 className="font-medium">{example.title}</h5>
                          <p className="text-sm text-muted-foreground mt-1">{example.description}</p>
                          <div className="mt-2 space-y-1">
                            {Object.entries(example.parameters).map(([key, value]) => (
                              <p key={key} className="text-sm">
                                <span className="font-medium">{key}:</span> {String(value)}
                              </p>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            <strong>Comportement:</strong> {example.expectedBehavior}
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => setParameters(example.parameters)}
                          >
                            Utiliser cet exemple
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setParameters({});
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={handleUseTemplate}>
                  Créer la règle
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};