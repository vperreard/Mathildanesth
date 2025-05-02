import { useState, useEffect } from 'react';
import { Button, Table, Badge, Card } from '@/components/ui';
import { OperatingSector } from '@/modules/planning/bloc-operatoire/models/BlocModels';
import AddSectorModal from './AddSectorModal';

interface SectorsListProps {
    onSelect?: (sector: OperatingSector) => void;
    selectable?: boolean;
}

export default function SectorsList({ onSelect, selectable = false }: SectorsListProps) {
    const [sectors, setSectors] = useState<OperatingSector[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        async function fetchSectors() {
            try {
                setIsLoading(true);
                const response = await fetch('/api/operating-sectors');

                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des secteurs');
                }

                const data = await response.json();
                setSectors(data);
                setError(null);
            } catch (error) {
                console.error('Erreur:', error);
                setError('Impossible de charger les secteurs opératoires');
            } finally {
                setIsLoading(false);
            }
        }

        fetchSectors();
    }, []);

    const handleAddSector = (newSector: OperatingSector) => {
        setSectors(prevSectors => [...prevSectors, newSector]);
        setShowAddModal(false);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md m-4">
                {error}
            </div>
        );
    }

    return (
        <Card className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Secteurs opératoires</h2>
                <Button onClick={() => setShowAddModal(true)}>Ajouter un secteur</Button>
            </div>

            {sectors.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                    Aucun secteur opératoire disponible
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sectors.map((sector) => (
                        <Card
                            key={sector.id}
                            className={`p-4 border-l-4 ${selectable ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                            style={{ borderLeftColor: sector.colorCode || '#000000' }}
                            onClick={selectable ? () => onSelect?.(sector) : undefined}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-lg">{sector.name}</h3>
                                    {sector.description && (
                                        <p className="text-gray-500 text-sm mt-1">{sector.description}</p>
                                    )}
                                    <div className="mt-2">
                                        <Badge variant={sector.isActive ? 'success' : 'destructive'}>
                                            {sector.isActive ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </div>
                                </div>
                                {!selectable && (
                                    <Button size="sm" variant="outline">Détails</Button>
                                )}
                            </div>
                            <div className="mt-3 text-sm">
                                <div className="flex justify-between items-center">
                                    <span>Max salles par superviseur:</span>
                                    <span className="font-semibold">{sector.maxRoomsPerSupervisor}</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {showAddModal && (
                <AddSectorModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onAdd={handleAddSector}
                />
            )}
        </Card>
    );
} 