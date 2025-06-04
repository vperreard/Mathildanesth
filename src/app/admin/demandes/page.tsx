'use client';

import React from 'react';
import UnifiedRequestList from '@/components/requests/UnifiedRequestList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Users,
  FileText
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export default function AdminRequestsPage() {
  // Statistiques des demandes
  const { data: stats } = useQuery({
    queryKey: ['request-stats'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/requests/stats');
      return response.data;
    }
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestion des demandes</h1>
        <p className="text-gray-600 mt-2">
          Centre de gestion unifié pour toutes les demandes
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{stats?.pending || 0}</p>
              <Clock className="h-8 w-8 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-red-600">{stats?.urgent || 0}</p>
              <AlertCircle className="h-8 w-8 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Complétées (30j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-green-600">{stats?.completed || 0}</p>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Temps moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{stats?.avgTime || '24'}h</p>
              <TrendingUp className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des demandes avec onglets */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            <FileText className="h-4 w-4 mr-1" />
            Toutes
          </TabsTrigger>
          <TabsTrigger value="urgent">
            <AlertCircle className="h-4 w-4 mr-1" />
            Urgentes
            {stats?.urgent > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.urgent}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="assigned">
            <Users className="h-4 w-4 mr-1" />
            Assignées à moi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <UnifiedRequestList 
            viewMode="admin"
            showCreateButton={false}
          />
        </TabsContent>

        <TabsContent value="urgent">
          <UnifiedRequestList 
            viewMode="admin"
            showCreateButton={false}
          />
        </TabsContent>

        <TabsContent value="assigned">
          <UnifiedRequestList 
            viewMode="admin"
            showCreateButton={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}