'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';

// Types simplifiés
interface OperatingRoom {
  id: number;
  name: string;
  number?: string;
  isActive: boolean;
  colorCode?: string;
}

interface ExtendedSecteur {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  displayOrder?: number;
  operatingRooms: OperatingRoom[];
}

// Composant salle simple
const SimpleRoom = ({ room }: { room: OperatingRoom }) => (
  <div className="flex items-center justify-between p-3 border rounded-md bg-white shadow-sm">
    <div className="flex items-center space-x-3">
      <Building2 className="h-4 w-4 text-green-600" />
      <div>
        <span className="font-medium text-sm">{room.name}</span>
        {room.number && <span className="text-xs text-gray-500 ml-2">N°{room.number}</span>}
      </div>
    </div>
    <Badge variant={room.isActive ? "default" : "secondary"}>
      {room.isActive ? "Actif" : "Inactif"}
    </Badge>
  </div>
);

// Composant secteur simple
const SimpleSector = ({ secteur }: { secteur: ExtendedSecteur }) => (
  <Card className="mb-4">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CardTitle className="text-lg font-semibold">{secteur.name}</CardTitle>
          <Badge variant={secteur.isActive ? "default" : "secondary"}>
            {secteur.isActive ? "Actif" : "Inactif"}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {secteur.description && (
        <p className="text-sm text-gray-600 mt-2">{secteur.description}</p>
      )}
    </CardHeader>

    <CardContent>
      {secteur.operatingRooms.length > 0 ? (
        <div className="space-y-2">
          {secteur.operatingRooms.map((room) => (
            <SimpleRoom key={room.id} room={room} />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune salle d'opération</p>
        </div>
      )}
    </CardContent>
  </Card>
);

// Composant principal simple (sans drag & drop)
export default function SecteursAdminSimple() {
  const [secteurs, setSecteurs] = useState<ExtendedSecteur[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSecteurs = async () => {
      try {
        const response = await fetch('/api/operating-sectors');
        if (!response.ok) throw new Error('Erreur de chargement');
        
        const data = await response.json();
        setSecteurs(data);
      } catch (error) {
        console.error('Erreur lors du chargement des secteurs:', error);
        toast.error('Erreur lors du chargement des secteurs');
      } finally {
        setLoading(false);
      }
    };

    fetchSecteurs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Chargement rapide...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Secteurs opératoires (Simple)</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau secteur
        </Button>
      </div>

      <div className="space-y-4">
        {secteurs.map((secteur) => (
          <SimpleSector key={secteur.id} secteur={secteur} />
        ))}
      </div>
    </div>
  );
}