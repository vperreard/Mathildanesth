var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { GripVertical } from 'lucide-react';
var OperatingRoomsConfigPanel = function () {
    var _a = useState([]), roomOrder = _a[0], setRoomOrder = _a[1];
    var _b = useState([]), sectorOrder = _b[0], setSectorOrder = _b[1];
    var _c = useState(false), showRoomOrderPanel = _c[0], setShowRoomOrderPanel = _c[1];
    useEffect(function () {
        // Charger l'ordre des salles depuis le localStorage
        var savedRoomOrder = localStorage.getItem('roomOrder');
        if (savedRoomOrder) {
            setRoomOrder(JSON.parse(savedRoomOrder));
        }
        // Charger l'ordre des secteurs depuis le localStorage
        var savedSectorOrder = localStorage.getItem('sectorOrder');
        if (savedSectorOrder) {
            setSectorOrder(JSON.parse(savedSectorOrder));
        }
    }, []);
    var saveRoomOrder = function (order) {
        localStorage.setItem('roomOrder', JSON.stringify(order));
    };
    var saveSectorOrder = function (order) {
        localStorage.setItem('sectorOrder', JSON.stringify(order));
    };
    var handleDragEnd = function (result) {
        console.log("Drag End Result:", result);
        var destination = result.destination, source = result.source, draggableId = result.draggableId, type = result.type;
        if (!destination)
            return;
        // Si on déplace une salle
        if (type === "ROOM") {
            var sourceSector = source.droppableId;
            var destSector_1 = destination.droppableId;
            var roomId_1 = draggableId;
            var newRoomOrder_1 = __spreadArray([], roomOrder, true);
            var sourceIndex = newRoomOrder_1.findIndex(function (room) { return room.id === roomId_1; });
            var room = newRoomOrder_1[sourceIndex];
            // Retirer la salle de son secteur d'origine
            newRoomOrder_1.splice(sourceIndex, 1);
            // Trouver l'index de destination dans le nouveau secteur
            var destIndex = newRoomOrder_1.findIndex(function (room) {
                if (room.sector === destSector_1) {
                    return room.orderInSector >= destination.index;
                }
                return false;
            });
            // Insérer la salle à sa nouvelle position
            if (destIndex === -1) {
                newRoomOrder_1.push(__assign(__assign({}, room), { sector: destSector_1, orderInSector: destination.index }));
            }
            else {
                newRoomOrder_1.splice(destIndex, 0, __assign(__assign({}, room), { sector: destSector_1, orderInSector: destination.index }));
            }
            // Mettre à jour l'ordre des salles dans chaque secteur
            var updatedRoomOrder = newRoomOrder_1.map(function (room, index) { return (__assign(__assign({}, room), { orderInSector: newRoomOrder_1.filter(function (r) { return r.sector === room.sector && r.orderInSector <= index; }).length - 1 })); });
            setRoomOrder(updatedRoomOrder);
            saveRoomOrder(updatedRoomOrder);
        }
        // Si on déplace un secteur
        else if (type === "SECTOR") {
            var newSectorOrder = __spreadArray([], sectorOrder, true);
            var removed = newSectorOrder.splice(source.index, 1)[0];
            newSectorOrder.splice(destination.index, 0, removed);
            setSectorOrder(newSectorOrder);
            saveSectorOrder(newSectorOrder);
        }
    };
    return (<div className="space-y-6">
            <Dialog open={showRoomOrderPanel} onOpenChange={setShowRoomOrderPanel}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Organisation des salles</DialogTitle>
                        <DialogDescription>
                            Glissez-déposez les salles pour les réorganiser. Vous pouvez également réorganiser les secteurs.
                        </DialogDescription>
                    </DialogHeader>

                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="all-sectors" type="SECTOR">
                            {function (provided) { return (<div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                    {sectorOrder.map(function (sector, index) { return (<Draggable key={sector} draggableId={sector} index={index}>
                                            {function (provided) { return (<div ref={provided.innerRef} {...provided.draggableProps} className="border rounded-lg p-4 bg-white">
                                                    <div {...provided.dragHandleProps} className="flex items-center justify-between mb-2">
                                                        <h3 className="text-lg font-semibold">{sector}</h3>
                                                        <GripVertical className="h-5 w-5 text-gray-400"/>
                                                    </div>

                                                    <Droppable droppableId={sector} type="ROOM">
                                                        {function (provided) { return (<div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                                                {roomOrder
                            .filter(function (room) { return room.sector === sector; })
                            .sort(function (a, b) { return a.orderInSector - b.orderInSector; })
                            .map(function (room, index) { return (<Draggable key={room.id} draggableId={room.id} index={index}>
                                                                            {function (provided) { return (<div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                                                                                    <GripVertical className="h-5 w-5 text-gray-400"/>
                                                                                    <span>{room.name}</span>
                                                                                </div>); }}
                                                                        </Draggable>); })}
                                                                {provided.placeholder}
                                                            </div>); }}
                                                    </Droppable>
                                                </div>); }}
                                        </Draggable>); })}
                                    {provided.placeholder}
                                </div>); }}
                        </Droppable>
                    </DragDropContext>
                </DialogContent>
            </Dialog>
        </div>);
};
export default OperatingRoomsConfigPanel;
