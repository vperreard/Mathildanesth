'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Save, Trash2, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Surgeon {
  id: number;
  nom: string;
  prenom: string;
  specialties: string[];
  status: string;
  userId?: number | null;
}

interface OperatingRoom {
  id: number;
  name: string;
  sectorId: number;
}

interface SurgeonVacation {
  surgeonId: number;
  dayOfWeek: number; // 1-5 (Lundi-Vendredi)
  period: 'AM' | 'PM';
  roomId: number;
  weekType: 'ALL' | 'ODD' | 'EVEN'; // Toutes, Impaires, Paires
}

interface TrameModele {
  id: number | string;
  name: string;
  siteId: string;
  isActive: boolean;
  detailsJson?: {
    selectedRooms?: string[];
    selectedSectors?: string[];
  };
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
];

const WEEK_TYPES = [
  { value: 'ALL', label: 'Toutes les semaines' },
  { value: 'ODD', label: 'Semaines impaires' },
  { value: 'EVEN', label: 'Semaines paires' },
];

export default function SurgeonVacationsEditor() {
  const [surgeons, setSurgeons] = useState<Surgeon[]>([]);
  const [operatingRooms, setOperatingRooms] = useState<OperatingRoom[]>([]);
  const [allOperatingRooms, setAllOperatingRooms] = useState<OperatingRoom[]>([]);
  const [trameModeles, setTrameModeles] = useState<TrameModele[]>([]);
  const [selectedTrameId, setSelectedTrameId] = useState<string>('');
  const [vacations, setVacations] = useState<SurgeonVacation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Charger les données initiales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Filtrer les salles quand une trame est sélectionnée
  useEffect(() => {
    if (selectedTrameId && trameModeles.length > 0) {
      const selectedTrame = trameModeles.find(t => t.id.toString() === selectedTrameId);

      if (selectedTrame && selectedTrame.detailsJson?.selectedRooms) {
        // Filtrer les salles selon celles définies dans la trame
        const allowedRoomIds = selectedTrame.detailsJson.selectedRooms.map(id => parseInt(id));
        const filteredRooms = allOperatingRooms.filter(room => allowedRoomIds.includes(room.id));
        setOperatingRooms(filteredRooms);
        logger.info(`Salles filtrées pour la trame ${selectedTrame.name}:`, filteredRooms.length);
      } else {
        // Si pas de restriction, afficher toutes les salles
        setOperatingRooms(allOperatingRooms);
      }
    } else {
      // Si aucune trame sélectionnée, afficher toutes les salles
      setOperatingRooms(allOperatingRooms);
    }
  }, [selectedTrameId, trameModeles, allOperatingRooms]);

  const loadInitialData = async () => {
    setIsLoading(true);

    // Charger les données en parallèle avec gestion d'erreur individuelle
    const loadPromises = [
      // Charger les chirurgiens
      axios
        .get('/api/surgeons')
        .then(response => {
          setSurgeons(response.data || []);
          logger.info('Chirurgiens chargés:', response.data?.length || 0);
        })
        .catch(error => {
          logger.error('Erreur lors du chargement des chirurgiens:', error);
          toast.error('Impossible de charger les chirurgiens');
          setSurgeons([]);
        }),

      // Charger les salles d'opération
      axios
        .get('/api/operating-rooms')
        .then(response => {
          const rooms = response.data || [];
          setAllOperatingRooms(rooms);
          setOperatingRooms(rooms);
          logger.info('Salles chargées:', rooms.length);
        })
        .catch(error => {
          logger.error('Erreur lors du chargement des salles:', error);
          toast.error("Impossible de charger les salles d'opération");
          setAllOperatingRooms([]);
          setOperatingRooms([]);
        }),

      // Charger les trames modèles
      axios
        .get('/api/trame-modeles')
        .then(response => {
          const trames = Array.isArray(response.data) ? response.data : [];
          const activeTrames = trames.filter((trame: any) => trame.isActive);
          setTrameModeles(activeTrames);
          logger.info('Trames modèles chargées:', activeTrames.length);
        })
        .catch(error => {
          logger.error('Erreur lors du chargement des trames:', error);
          toast.error('Impossible de charger les trames modèles');
          setTrameModeles([]);
        }),
    ];

    // Attendre que toutes les promesses se terminent
    await Promise.allSettled(loadPromises);
    setIsLoading(false);
  };

  const addVacation = () => {
    if (!selectedTrameId) {
      toast.error("Veuillez d'abord sélectionner une trame modèle");
      return;
    }

    if (surgeons.length === 0) {
      toast.error('Aucun chirurgien disponible');
      return;
    }

    if (operatingRooms.length === 0) {
      toast.error('Aucune salle disponible pour cette trame');
      return;
    }

    const newVacation: SurgeonVacation = {
      surgeonId: surgeons[0].id,
      dayOfWeek: 1,
      period: 'AM',
      roomId: operatingRooms[0].id,
      weekType: 'ALL',
    };
    setVacations([...vacations, newVacation]);
  };

  const removeVacation = (index: number) => {
    setVacations(vacations.filter((_, i) => i !== index));
  };

  const updateVacation = (index: number, field: keyof SurgeonVacation, value: any) => {
    const updatedVacations = [...vacations];
    updatedVacations[index] = { ...updatedVacations[index], [field]: value };
    setVacations(updatedVacations);
  };

  const saveVacations = async () => {
    if (!selectedTrameId) {
      toast.error('Veuillez sélectionner une trame modèle');
      return;
    }

    if (vacations.length === 0) {
      toast.error('Aucune vacation à enregistrer');
      return;
    }

    try {
      setIsSaving(true);

      // Créer les affectations dans la trame pour chaque vacation
      const promises = vacations.map(async vacation => {
        const surgeon = surgeons.find(s => s.id === vacation.surgeonId);
        const room = operatingRooms.find(r => r.id === vacation.roomId);

        if (!surgeon || !room) return;

        // Déterminer les semaines concernées
        let weekNumbers: number[] = [];
        if (vacation.weekType === 'ALL') {
          weekNumbers = Array.from({ length: 52 }, (_, i) => i + 1);
        } else if (vacation.weekType === 'ODD') {
          weekNumbers = Array.from({ length: 26 }, (_, i) => i * 2 + 1);
        } else if (vacation.weekType === 'EVEN') {
          weekNumbers = Array.from({ length: 26 }, (_, i) => i * 2 + 2);
        }

        // Créer une affectation pour chaque semaine
        const affectationData = {
          trameModeleId: selectedTrameId,
          dayOfWeek: vacation.dayOfWeek,
          period: vacation.period,
          roomId: vacation.roomId,
          surgeonId: vacation.surgeonId,
          surgeonName: `${surgeon.prenom} ${surgeon.nom}`,
          weekNumbers,
          affectationType: 'CHIRURGIEN',
          activityType: 'INTERVENTION',
        };

        return axios.post(`/api/trame-modeles/${selectedTrameId}/affectations`, affectationData);
      });

      await Promise.all(promises);

      toast.success('Vacations enregistrées avec succès');
      setVacations([]);
    } catch (error) {
      logger.error("Erreur lors de l'enregistrement des vacations:", error);
      toast.error("Erreur lors de l'enregistrement des vacations");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Sélection de la trame modèle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sélectionner une trame modèle</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedTrameId}
            onChange={e => {
              setSelectedTrameId(e.target.value);
              setVacations([]); // Réinitialiser les vacations quand on change de trame
            }}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Sélectionner une trame --</option>
            {trameModeles.map(trame => (
              <option key={trame.id} value={trame.id}>
                {trame.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Configuration des vacations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Configuration des vacations</CardTitle>
          <button
            onClick={addVacation}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une vacation
          </button>
        </CardHeader>
        <CardContent>
          {vacations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune vacation configurée</p>
              <p className="text-sm mt-2">Cliquez sur "Ajouter une vacation" pour commencer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vacations.map((vacation, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Chirurgien */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chirurgien
                      </label>
                      <select
                        value={vacation.surgeonId}
                        onChange={e => updateVacation(index, 'surgeonId', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      >
                        {surgeons.map(surgeon => (
                          <option key={surgeon.id} value={surgeon.id}>
                            {surgeon.prenom} {surgeon.nom}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Jour */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jour</label>
                      <select
                        value={vacation.dayOfWeek}
                        onChange={e => updateVacation(index, 'dayOfWeek', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      >
                        {DAYS_OF_WEEK.map(day => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Période */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Période
                      </label>
                      <select
                        value={vacation.period}
                        onChange={e =>
                          updateVacation(index, 'period', e.target.value as 'AM' | 'PM')
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="AM">Matin</option>
                        <option value="PM">Après-midi</option>
                      </select>
                    </div>

                    {/* Salle */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salle</label>
                      <select
                        value={vacation.roomId}
                        onChange={e => updateVacation(index, 'roomId', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      >
                        {operatingRooms.map(room => (
                          <option key={room.id} value={room.id}>
                            {room.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Fréquence */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fréquence
                      </label>
                      <select
                        value={vacation.weekType}
                        onChange={e =>
                          updateVacation(
                            index,
                            'weekType',
                            e.target.value as 'ALL' | 'ODD' | 'EVEN'
                          )
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      >
                        {WEEK_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => removeVacation(index)}
                      className="text-sm text-red-600 hover:text-red-700 px-3 py-1 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2 inline" />
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {vacations.length > 0 && (
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setVacations([])}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={saveVacations}
            disabled={isSaving || !selectedTrameId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Clock className="w-4 h-4 mr-2 inline animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2 inline" />
                Enregistrer les vacations
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
