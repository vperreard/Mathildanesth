// Import des mêmes dépendances et types que page.tsx

// Fonction corrigée pour l'import de données
const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const content = event.target?.result as string;
            setImportData(content);

            // Parser les données CSV basiques
            if (file.name.endsWith('.csv')) {
                const lines = content.split('\n');
                const headers = lines[0].split(',');

                // Indices des colonnes
                const dateIndex = headers.findIndex(h => h.includes('Date'));
                const roomIndex = headers.findIndex(h => h.includes('Salle'));
                const shiftIndex = headers.findIndex(h => h.includes('Créneau'));
                const surgeonIndex = headers.findIndex(h => h.includes('Chirurgien'));
                const marIndex = headers.findIndex(h => h.includes('MAR'));
                const iadeIndex = headers.findIndex(h => h.includes('IADE'));

                // Convertir en assignations
                const newAssignments: Assignment[] = [];
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;

                    const values = lines[i].split(',');
                    if (values.length < Math.max(dateIndex, roomIndex, shiftIndex) + 1) continue;

                    // Trouver les IDs correspondants
                    const foundRoom = rooms.find(r =>
                        values[roomIndex] && r.name && r.name.includes(values[roomIndex]));
                    const roomId = foundRoom ? foundRoom.id : 0;

                    let surgeonId = null;
                    if (values[surgeonIndex] && values[surgeonIndex].trim()) {
                        const surgeonName = values[surgeonIndex].split(' ');
                        const foundSurgeon = surgeons.find(s =>
                            s.nom && surgeonName.length > 0 &&
                            s.nom.includes(surgeonName[surgeonName.length - 1]));

                        surgeonId = foundSurgeon?.id || null;

                        // Décider si c'est un MAR ou un IADE
                        let userId = null;
                        if (values[marIndex] && values[marIndex].trim()) {
                            const marName = values[marIndex].split(' ');
                            userId = users.find(u =>
                                u.role === 'MAR' &&
                                u.nom.includes(marName[marName.length - 1]))?.id || null;
                        } else if (values[iadeIndex] && values[iadeIndex].trim()) {
                            const iadeName = values[iadeIndex].split(' ');
                            userId = users.find(u =>
                                u.role === 'IADE' &&
                                u.nom.includes(iadeName[iadeName.length - 1]))?.id || null;
                        }

                        if (roomId) {
                            newAssignments.push({
                                id: Date.now() + i, // ID temporaire
                                roomId,
                                surgeonId,
                                userId,
                                date: new Date(values[dateIndex]),
                                shift: values[shiftIndex].toLowerCase().includes('matin') ? 'matin' : 'apresmidi',
                                isNew: true
                            });
                        }
                    }
                }
                setImportPreview(newAssignments);
            }
        } catch (error) {
            console.error("Erreur lors du parsing du fichier importé:", error);
        }
    };
    reader.readAsText(file);
};

// Export à la fin du fichier
export default handleImportFile; 