import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X, Lock, Calendar, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/types/user';

type WeekType = 'EVEN' | 'ODD' | 'ALL';
type DayType = 'WEEKDAY' | 'WEEKEND';
type PostType = 'CHIRURGIEN' | 'MAR' | 'IADE' | 'INFIRMIER' | 'AUTRE';
type AssignmentType = 'GARDE' | 'ASTREINTE' | 'CS1' | 'CS2' | 'CS3' | 'SALLE';

interface Post {
    id: string;
    type: PostType;
    name: string;
    required: boolean;
    maxCount: number;
    minCount: number;
}

interface Attribution {
    id: string;
    type: AssignmentType;
    name: string;
    duration: number; // en heures
    posts: Post[];
    isActive: boolean;
}

interface TramePeriod {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    color: string;
    isActive: boolean;
    attributions: Attribution[];
    isLocked: boolean;
}

interface Tableau de service {
    id: string;
    name: string;
    description: string;
    weekType: WeekType;
    dayType: DayType;
    periods: TramePeriod[];
    isActive: boolean;
    isLocked: boolean;
}

const MOCK_TRAMES: Tableau de service[] = [
    {
        id: '1',
        name: 'Tableau de service Standard Semaine',
        description: 'Tableau de service standard pour les jours de semaine',
        weekType: 'ALL',
        dayType: 'WEEKDAY',
        isActive: true,
        isLocked: false,
        periods: [
            {
                id: '1-1',
                name: 'Matin',
                startTime: '08:00',
                endTime: '12:00',
                color: '#4CAF50',
                isActive: true,
                isLocked: false,
                attributions: [
                    {
                        id: '1-1-1',
                        type: 'CS1',
                        name: 'Consultation 1',
                        duration: 4,
                        isActive: true,
                        posts: [
                            {
                                id: '1-1-1-1',
                                type: 'MAR',
                                name: 'MAR',
                                required: true,
                                maxCount: 1,
                                minCount: 1
                            }
                        ]
                    },
                    {
                        id: '1-1-2',
                        type: 'CS2',
                        name: 'Consultation 2',
                        duration: 4,
                        isActive: true,
                        posts: [
                            {
                                id: '1-1-2-1',
                                type: 'MAR',
                                name: 'MAR',
                                required: true,
                                maxCount: 1,
                                minCount: 1
                            }
                        ]
                    },
                    {
                        id: '1-1-3',
                        type: 'CS3',
                        name: 'Consultation 3',
                        duration: 4,
                        isActive: true,
                        posts: [
                            {
                                id: '1-1-3-1',
                                type: 'MAR',
                                name: 'MAR',
                                required: true,
                                maxCount: 1,
                                minCount: 1
                            }
                        ]
                    }
                ]
            },
            {
                id: '1-2',
                name: 'Après-midi',
                startTime: '13:00',
                endTime: '17:00',
                color: '#2196F3',
                isActive: true,
                isLocked: false,
                attributions: [
                    {
                        id: '1-2-1',
                        type: 'CS1',
                        name: 'Consultation 1',
                        duration: 4,
                        isActive: true,
                        posts: [
                            {
                                id: '1-2-1-1',
                                type: 'MAR',
                                name: 'MAR',
                                required: true,
                                maxCount: 1,
                                minCount: 1
                            }
                        ]
                    },
                    {
                        id: '1-2-2',
                        type: 'CS2',
                        name: 'Consultation 2',
                        duration: 4,
                        isActive: true,
                        posts: [
                            {
                                id: '1-2-2-1',
                                type: 'MAR',
                                name: 'MAR',
                                required: true,
                                maxCount: 1,
                                minCount: 1
                            }
                        ]
                    },
                    {
                        id: '1-2-3',
                        type: 'CS3',
                        name: 'Consultation 3',
                        duration: 4,
                        isActive: true,
                        posts: [
                            {
                                id: '1-2-3-1',
                                type: 'MAR',
                                name: 'MAR',
                                required: true,
                                maxCount: 1,
                                minCount: 1
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: '2',
        name: 'Tableau de service Weekend',
        description: 'Tableau de service pour les weekends',
        weekType: 'ALL',
        dayType: 'WEEKEND',
        isActive: true,
        isLocked: false,
        periods: [
            {
                id: '2-1',
                name: 'Garde',
                startTime: '08:00',
                endTime: '08:00',
                color: '#9C27B0',
                isActive: true,
                isLocked: false,
                attributions: [
                    {
                        id: '2-1-1',
                        type: 'GARDE',
                        name: 'Garde 24h',
                        duration: 24,
                        isActive: true,
                        posts: [
                            {
                                id: '2-1-1-1',
                                type: 'MAR',
                                name: 'MAR',
                                required: true,
                                maxCount: 1,
                                minCount: 1
                            }
                        ]
                    }
                ]
            },
            {
                id: '2-2',
                name: 'Astreinte',
                startTime: '08:00',
                endTime: '08:00',
                color: '#FF9800',
                isActive: true,
                isLocked: false,
                attributions: [
                    {
                        id: '2-2-1',
                        type: 'ASTREINTE',
                        name: 'Astreinte 24h',
                        duration: 24,
                        isActive: true,
                        posts: [
                            {
                                id: '2-2-1-1',
                                type: 'MAR',
                                name: 'MAR',
                                required: true,
                                maxCount: 1,
                                minCount: 1
                            }
                        ]
                    }
                ]
            }
        ]
    }
];

const ASSIGNMENT_TYPES = [
    { value: 'GARDE', label: 'Garde' },
    { value: 'ASTREINTE', label: 'Astreinte' },
    { value: 'CS1', label: 'Consultation 1' },
    { value: 'CS2', label: 'Consultation 2' },
    { value: 'CS3', label: 'Consultation 3' },
    { value: 'SALLE', label: 'Salle Opératoire' }
];

const POST_TYPES = [
    { value: 'CHIRURGIEN', label: 'Chirurgien' },
    { value: 'MAR', label: 'MAR' },
    { value: 'IADE', label: 'IADE' },
    { value: 'INFIRMIER', label: 'Infirmier' },
    { value: 'AUTRE', label: 'Autre' }
];

const WEEK_TYPES = [
    { value: 'EVEN', label: 'Semaines paires' },
    { value: 'ODD', label: 'Semaines impaires' },
    { value: 'ALL', label: 'Toutes les semaines' }
];

const DAY_TYPES = [
    { value: 'WEEKDAY', label: 'Jours de semaine' },
    { value: 'WEEKEND', label: 'Weekend' }
];

const TramesConfigPanel: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN_TOTAL';
    const [tableaux de service, setTrames] = useState<Tableau de service[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedTrame, setSelectedTrame] = useState<Tableau de service | null>(null);
    const [editingPeriod, setEditingPeriod] = useState<TramePeriod | null>(null);
    const [formData, setFormData] = useState<Partial<Tableau de service>>({
        name: '',
        description: '',
        weekType: 'ALL',
        dayType: 'WEEKDAY',
        isActive: true,
        isLocked: false,
        periods: []
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        console.log("TramesConfigPanel - useEffect - Chargement initial");
        setLoading(true);
        setTimeout(() => {
            setTrames(MOCK_TRAMES);
            setLoading(false);
            console.log("TramesConfigPanel - useEffect - Données chargées:", MOCK_TRAMES);
        }, 500);
    }, []);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSave = async () => {
        if (!validateForm()) {
            toast.error('Veuillez corriger les erreurs dans le formulaire');
            return;
        }

        try {
            setSaving(true);

            if (selectedTrame) {
                setTrames(prev => prev.map(tableau de service =>
                    tableau de service.id === selectedTrame.id ? { ...tableau de service, ...formData } : tableau de service
                ));
                toast.success('Tableau de service mise à jour avec succès');
            } else {
                const newTrame: Tableau de service = {
                    ...formData as Tableau de service,
                    id: Date.now().toString(),
                    periods: []
                };
                setTrames(prev => [...prev, newTrame]);
                toast.success('Nouvelle tableau de service créée avec succès');
            }

            setFormData({
                name: '',
                description: '',
                weekType: 'ALL',
                dayType: 'WEEKDAY',
                isActive: true,
                isLocked: false,
                periods: []
            });
            setSelectedTrame(null);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (tableau de service: Tableau de service) => {
        if (!isAdmin) {
            toast.error('Vous n\'avez pas les droits pour modifier cette tableau de service');
            return;
        }
        setFormData(tableau de service);
        setSelectedTrame(tableau de service);
    };

    const handleDelete = async (id: string) => {
        if (!isAdmin) {
            toast.error('Vous n\'avez pas les droits pour supprimer cette tableau de service');
            return;
        }

        try {
            setTrames(prev => prev.filter(tableau de service => tableau de service.id !== id));
            toast.success('Tableau de service supprimée avec succès');
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleCancel = () => {
        setFormData({
            name: '',
            description: '',
            weekType: 'ALL',
            dayType: 'WEEKDAY',
            isActive: true,
            isLocked: false,
            periods: []
        });
        setSelectedTrame(null);
        setErrors({});
    };

    const handleAddPeriod = () => {
        const newPeriod: TramePeriod = {
            id: Date.now().toString(),
            name: '',
            startTime: '',
            endTime: '',
            color: '#4CAF50',
            isActive: true,
            isLocked: false,
            attributions: []
        };
        setFormData(prev => ({
            ...prev,
            periods: [...(prev.periods || []), newPeriod]
        }));
    };

    const handleEditPeriod = (period: TramePeriod) => {
        setEditingPeriod(period);
    };

    const handleDeletePeriod = (periodId: string) => {
        setFormData(prev => ({
            ...prev,
            periods: (prev.periods || []).filter(p => p.id !== periodId)
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name) {
            newErrors.name = 'Le nom est requis';
        }

        if (!formData.weekType) {
            newErrors.weekType = 'Le type de semaine est requis';
        }

        if (!formData.dayType) {
            newErrors.dayType = 'Le type de jour est requis';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNewTrame = () => {
        console.log("TramesConfigPanel - handleNewTrame - Création d'une nouvelle tableau de service");
        setSelectedTrame(null);
        setFormData({
            name: '',
            description: '',
            weekType: 'ALL',
            dayType: 'WEEKDAY',
            isActive: true,
            isLocked: false,
            periods: []
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
                <div>
                    <h2 className="text-2xl font-bold">Gestion des Tableaux de service</h2>
                    <p className="text-gray-600 mt-1">Configurez les tableaux de service horaires pour les gardes/vacations</p>
                </div>
                {isAdmin ? (
                    <Button
                        onClick={handleNewTrame}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="h-4 w-4" />
                        Nouvelle Tableau de service
                    </Button>
                ) : (
                    <div className="text-sm text-gray-500">
                        Connectez-vous en tant qu'administrateur pour créer des tableaux de service
                    </div>
                )}
            </div>

            {!isAdmin && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Lock className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Vous n'avez pas les droits d'administrateur nécessaires pour modifier les tableaux de service.
                                Veuillez contacter un administrateur pour effectuer des modifications.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Formulaire principal */}
            {(selectedTrame === null || selectedTrame) && (
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <h3 className="text-lg font-semibold">
                        {selectedTrame ? 'Modifier la Tableau de service' : 'Nouvelle Tableau de service'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom
                            </label>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleFormChange}
                                placeholder="Nom de la tableau de service"
                                error={errors.name}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type de Semaine
                            </label>
                            <Select
                                value={formData.weekType}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, weekType: value as WeekType }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {WEEK_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type de Jour
                            </label>
                            <Select
                                value={formData.dayType}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, dayType: value as DayType }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DAY_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <Textarea
                                name="description"
                                value={formData.description}
                                onChange={handleFormChange}
                                placeholder="Description de la tableau de service"
                            />
                        </div>
                    </div>

                    {/* Périodes */}
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-medium">Périodes</h4>
                            <Button
                                onClick={handleAddPeriod}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Ajouter une période
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {formData.periods?.map((period) => (
                                <div key={period.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h5 className="font-medium">{period.name || 'Nouvelle période'}</h5>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditPeriod(period)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeletePeriod(period.id)}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-600">Horaires</label>
                                            <p className="text-sm">{period.startTime} - {period.endTime}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600">Gardes/Vacations</label>
                                            <p className="text-sm">{period.attributions.length} garde/vacation(s)</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="flex items-center gap-2"
                        >
                            <X className="h-4 w-4" />
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Liste des tableaux de service */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-medium">Tableaux de service existantes</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {tableaux de service.length === 0
                            ? "Aucune tableau de service n'a été créée. Cliquez sur 'Nouvelle Tableau de service' pour commencer."
                            : `${tableaux de service.length} tableau de service(s) configurée(s)`}
                    </p>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nom
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type de Semaine
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type de Jour
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Périodes
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                État
                            </th>
                            {isAdmin && (
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tableaux de service.map((tableau de service) => (
                            <tr key={tableau de service.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {tableau de service.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-500">
                                        {tableau de service.description}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                        {WEEK_TYPES.find(t => t.value === tableau de service.weekType)?.label}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                        {DAY_TYPES.find(t => t.value === tableau de service.dayType)?.label}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-500">
                                        {tableau de service.periods.length} période(s)
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {tableau de service.isLocked && (
                                            <Lock className="h-4 w-4 text-gray-400 mr-1" />
                                        )}
                                        <span className={`px-2 py-1 rounded-full text-xs ${tableau de service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {tableau de service.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </td>
                                {isAdmin && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(tableau de service)}
                                                className="flex items-center gap-1"
                                                disabled={tableau de service.isLocked}
                                            >
                                                <Pencil className="h-4 w-4" />
                                                Modifier
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(tableau de service.id)}
                                                className="flex items-center gap-1 text-red-600 hover:text-red-700"
                                                disabled={tableau de service.isLocked}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Supprimer
                                            </Button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TramesConfigPanel; 