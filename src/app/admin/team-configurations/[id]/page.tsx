'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TeamConfiguration } from '@/types/team-configuration';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import TabsContainer from './TabsContainer';

const defaultConfig: TeamConfiguration = {
    name: '',
    description: '',
    isDefault: false,
    isActive: true,
    gardes: {
        structure: {
            parJour: {
                garde: 1,
                astreinte: 1
            }
        },
        regles: {
            espacementMinimum: 3,
            espacementIdeal: 7,
            maxParMois: 3,
            maxExceptionnel: 4,
            reposApresGarde: {
                obligatoire: true,
                duree: 24
            },
            incompatibilites: [
                "CONSULTATION",
                "BLOC",
                "ASTREINTE"
            ]
        },
        distribution: {
            weekends: {
                poids: 1.5,
                rotationAnnuelle: true
            },
            joursFeries: {
                poids: 2.0,
                compteSepare: true
            },
            feteFinAnnee: {
                gestionManuelle: true,
                suivi: true
            }
        }
    },
    consultations: {
        volume: {
            tempsPlein: 2,
            proportionnelTempsPartiel: true
        },
        limites: {
            maxParSemaine: 3,
            repartitionMaximale: "2-1"
        },
        flexibilite: {
            fermeturePeriodes: true,
            generationPartielle: true
        }
    },
    bloc: {
        salles: {
            chirurgie: {
                nombre: 13,
                numeros: ["1", "2", "3", "4", "5", "6", "7", "9", "10", "11", "12", "12bis"]
            },
            cesarienne: {
                nombre: 1,
                numeros: ["8"]
            },
            ophtalmologie: {
                nombre: 4,
                numeros: ["Ophta 1", "Ophta 2", "Ophta 3", "Ophta 4"]
            },
            endoscopie: {
                nombre: 4,
                numeros: ["Endo 1", "Endo 2", "Endo 3", "Endo 4"]
            }
        },
        supervision: {
            reglesBase: {
                maxSallesParMAR: 2,
                maxExceptionnel: 3
            },
            reglesParSecteur: {
                "HYPERASEPTIQUE": {
                    salles: ["1", "2", "3", "4"],
                    supervisionInterne: true,
                    exceptions: ["MAR_S3_S4_VERS_S5"]
                },
                "SECTEUR_5_8": {
                    salles: ["5", "6", "7", "8"],
                    supervisionCroisee: ["OPHTALMO"]
                },
                "SECTEUR_9_12B": {
                    salles: ["9", "10", "11", "12", "12bis"],
                    supervisionContigues: true
                },
                "OPHTALMO": {
                    maxParPersonnel: 3,
                    supervisionDepuis: ["S6", "S7"]
                },
                "ENDOSCOPIE": {
                    maxParPersonnel: 2,
                    supervisionDepuis: ["S10", "S11", "S12B"]
                }
            }
        }
    },
    conges: {
        quotas: {
            tempsPlein: 50,
            proportionnelTempsPartiel: true
        },
        decompte: {
            joursOuvrables: true,
            exclusFeries: true
        },
        validation: {
            workflow: "SIMPLE",
            delaiMinimum: 30
        },
        restrictions: {
            periodePic: {
                ete: {
                    maxSimultane: 3,
                    priorite: "ANCIENNETE"
                },
                noel: {
                    maxSimultane: 2,
                    priorite: "ROTATION"
                }
            }
        }
    }
};

export default function ConfigurationEditPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const isNew = id === 'new';

    const [config, setConfig] = useState<TeamConfiguration>(defaultConfig);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('general');

    // Charger la configuration existante si ce n'est pas une nouvelle
    useEffect(() => {
        if (isNew) return;

        const fetchConfiguration = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:3000/api/admin/team-configurations?id=${id}`);

                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération de la configuration');
                }

                const data = await response.json();
                setConfig(data);
            } catch (err: any) {
                setError(err.message || 'Une erreur est survenue');
                toast.error(err.message || 'Une erreur est survenue');
            } finally {
                setLoading(false);
            }
        };

        fetchConfiguration();
    }, [id, isNew]);

    // Mettre à jour la configuration
    const handleSubmit = async () => {
        try {
            setSaving(true);
            setError(null);

            const method = isNew ? 'POST' : 'PUT';
            const url = isNew
                ? '/api/admin/team-configurations'
                : `/api/admin/team-configurations?id=${id}`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Erreur lors de la ${isNew ? 'création' : 'mise à jour'}`);
            }

            toast.success(`Configuration ${isNew ? 'créée' : 'mise à jour'} avec succès`);

            if (isNew) {
                const data = await response.json();
                router.push(`/admin/team-configurations/${data.id}`);
            }
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
            toast.error(err.message || 'Une erreur est survenue');
        } finally {
            setSaving(false);
        }
    };

    // Mettre à jour un champ dans la configuration
    const updateConfig = (path: string, value: any) => {
        setConfig((prev) => {
            const newConfig = { ...prev };
            const pathParts = path.split('.');
            let current: any = newConfig;

            // Naviguer jusqu'au parent de la propriété à modifier
            for (let i = 0; i < pathParts.length - 1; i++) {
                if (!current[pathParts[i]]) {
                    current[pathParts[i]] = {};
                }
                current = current[pathParts[i]];
            }

            // Mettre à jour la propriété
            current[pathParts[pathParts.length - 1]] = value;

            return newConfig;
        });
    };

    if (loading) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">
                    {isNew ? 'Nouvelle configuration' : 'Modification de la configuration'}
                </h1>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                    {isNew ? 'Nouvelle configuration' : `Configuration: ${config.name}`}
                </h1>
                <div className="flex space-x-2">
                    <Link
                        href="/admin/team-configurations"
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
                    >
                        Retour
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    <p>{error}</p>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <TabsContainer
                    config={config}
                    updateConfig={updateConfig}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />
            </div>
        </div>
    );
} 