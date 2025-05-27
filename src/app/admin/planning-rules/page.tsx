'use client';

import React, { useState } from 'react';
import { Plus, Activity, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RuleBuilder } from '@/modules/dynamicRules/v2/components/RuleBuilder/RuleBuilder';
import { RuleV2, RuleTemplate } from '@/modules/dynamicRules/v2/types/ruleV2.types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';

export default function PlanningRulesPage() {
  const [activeTab, setActiveTab] = useState('rules');
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleV2 | undefined>();
  const [selectedTemplate, setSelectedTemplate] = useState<RuleTemplate | undefined>();

  const queryClient = useQueryClient();

  // Fetch rules
  const { data: rulesData } = useQuery({
    queryKey: ['rules'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/api/admin/rules/v2');
      if (!response.ok) throw new Error('Failed to fetch rules');
      return response.json();
    }
  });

  // Create/Update rule mutation
  const saveRuleMutation = useMutation({
    mutationFn: async (rule: Partial<RuleV2>) => {
      const isUpdate = !!rule.id;
      const url = isUpdate 
        ? `/api/admin/rules/v2/${rule.id}`
        : '/api/admin/rules/v2';
      
      const response = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save rule');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      
      if (data.conflicts?.length > 0) {
        toast.warning(`Règle enregistrée avec ${data.conflicts.length} conflit(s) détecté(s)`);
      } else {
        toast.success('Règle enregistrée avec succès');
      }
      
      setShowBuilder(false);
      setEditingRule(undefined);
      setSelectedTemplate(undefined);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const handleCloseBuilder = () => {
    setShowBuilder(false);
    setEditingRule(undefined);
    setSelectedTemplate(undefined);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Règles de Planning</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les règles dynamiques pour la génération et validation des plannings
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/planning-rules/dashboard">
            <Button variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          
          <Button
            variant="outline"
            onClick={() => setActiveTab('modèles')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Modèles
          </Button>
          
          <Button
            onClick={() => setShowBuilder(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle règle
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rules">
            Règles
            {rulesData?.rules?.length > 0 && (
              <Badge className="ml-2" variant="secondary">{rulesData.rules.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="modèles">
            Modèles
          </TabsTrigger>
          <TabsTrigger value="conflicts">
            Conflits
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            Monitoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Liste des règles à implémenter</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modèles" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Modèles de règles à implémenter</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Panneau de résolution des conflits à implémenter</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Dashboard de monitoring à implémenter</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rule Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed inset-4 bg-background border rounded-lg shadow-lg overflow-auto">
            <div className="p-6">
              <RuleBuilder
                rule={editingRule}
                modèle={selectedTemplate}
                onSave={(rule) => saveRuleMutation.mutate(rule)}
                onCancel={handleCloseBuilder}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}