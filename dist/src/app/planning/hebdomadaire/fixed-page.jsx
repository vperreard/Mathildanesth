// Import des mêmes dépendances et types que page.tsx
// Fonction corrigée pour l'import de données
var handleImportFile = function (e) {
    var _a;
    var file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
    if (!file)
        return;
    var reader = new FileReader();
    reader.onload = function (event) {
        var _a, _b, _c;
        try {
            var content = (_a = event.target) === null || _a === void 0 ? void 0 : _a.result;
            setImportData(content);
            // Parser les données CSV basiques
            if (file.name.endsWith('.csv')) {
                var lines = content.split('\n');
                var headers = lines[0].split(',');
                // Indices des colonnes
                var dateIndex = headers.findIndex(function (h) { return h.includes('Date'); });
                var roomIndex_1 = headers.findIndex(function (h) { return h.includes('Salle'); });
                var shiftIndex = headers.findIndex(function (h) { return h.includes('Créneau'); });
                var surgeonIndex = headers.findIndex(function (h) { return h.includes('Chirurgien'); });
                var marIndex = headers.findIndex(function (h) { return h.includes('MAR'); });
                var iadeIndex = headers.findIndex(function (h) { return h.includes('IADE'); });
                // Convertir en assignations
                var newAssignments = [];
                var _loop_1 = function (i) {
                    if (!lines[i].trim())
                        return "continue";
                    var values = lines[i].split(',');
                    if (values.length < Math.max(dateIndex, roomIndex_1, shiftIndex) + 1)
                        return "continue";
                    // Trouver les IDs correspondants
                    var foundRoom = rooms.find(function (r) {
                        return values[roomIndex_1] && r.name && r.name.includes(values[roomIndex_1]);
                    });
                    var roomId = foundRoom ? foundRoom.id : 0;
                    var surgeonId = null;
                    if (values[surgeonIndex] && values[surgeonIndex].trim()) {
                        var surgeonName_1 = values[surgeonIndex].split(' ');
                        var foundSurgeon = surgeons.find(function (s) {
                            return s.nom && surgeonName_1.length > 0 &&
                                s.nom.includes(surgeonName_1[surgeonName_1.length - 1]);
                        });
                        surgeonId = (foundSurgeon === null || foundSurgeon === void 0 ? void 0 : foundSurgeon.id) || null;
                        // Décider si c'est un MAR ou un IADE
                        var userId = null;
                        if (values[marIndex] && values[marIndex].trim()) {
                            var marName_1 = values[marIndex].split(' ');
                            userId = ((_b = users.find(function (u) {
                                return u.role === 'MAR' &&
                                    u.nom.includes(marName_1[marName_1.length - 1]);
                            })) === null || _b === void 0 ? void 0 : _b.id) || null;
                        }
                        else if (values[iadeIndex] && values[iadeIndex].trim()) {
                            var iadeName_1 = values[iadeIndex].split(' ');
                            userId = ((_c = users.find(function (u) {
                                return u.role === 'IADE' &&
                                    u.nom.includes(iadeName_1[iadeName_1.length - 1]);
                            })) === null || _c === void 0 ? void 0 : _c.id) || null;
                        }
                        if (roomId) {
                            newAssignments.push({
                                id: Date.now() + i, // ID temporaire
                                roomId: roomId,
                                surgeonId: surgeonId,
                                userId: userId,
                                date: new Date(values[dateIndex]),
                                shift: values[shiftIndex].toLowerCase().includes('matin') ? 'matin' : 'apresmidi',
                                isNew: true
                            });
                        }
                    }
                };
                for (var i = 1; i < lines.length; i++) {
                    _loop_1(i);
                }
                setImportPreview(newAssignments);
            }
        }
        catch (error) {
            console.error("Erreur lors du parsing du fichier importé:", error);
        }
    };
    reader.readAsText(file);
};
// Export à la fin du fichier
export default handleImportFile;
