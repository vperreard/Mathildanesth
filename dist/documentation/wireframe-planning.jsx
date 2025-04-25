import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Bell, Settings, Filter, Download, AlertTriangle, Check, RefreshCw } from 'lucide-react';
var PlanningInterface = function () {
    var _a = useState('Semaine du 21 au 27 Avril 2025'), currentWeek = _a[0], setCurrentWeek = _a[1];
    return (<div className="flex flex-col h-screen bg-gray-50">
      {/* Barre de navigation */}
      <header className="bg-white shadow-sm py-4 px-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="font-bold text-xl text-blue-600">PlanningAnesthésie</div>
            <nav className="hidden md:flex space-x-6 ml-10">
              <a href="#" className="font-medium text-blue-600 border-b-2 border-blue-600 pb-1">Planning</a>
              <a href="#" className="font-medium text-gray-500 hover:text-gray-900">Gardes</a>
              <a href="#" className="font-medium text-gray-500 hover:text-gray-900">Consultations</a>
              <a href="#" className="font-medium text-gray-500 hover:text-gray-900">Congés</a>
              <a href="#" className="font-medium text-gray-500 hover:text-gray-900">Statistiques</a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-600 hover:text-gray-900">
              <Bell size={20}/>
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900">
              <Settings size={20}/>
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-medium">DR</div>
              <span className="hidden md:inline text-sm font-medium">Dr. Dupont</span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 overflow-auto">
        {/* Barre d'outils */}
        <div className="bg-white border-b p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded hover:bg-gray-100">
              <ChevronLeft size={20}/>
            </button>
            <h2 className="font-semibold text-lg">{currentWeek}</h2>
            <button className="p-2 rounded hover:bg-gray-100">
              <ChevronRight size={20}/>
            </button>
            <span className="border-l h-6 mx-2"></span>
            <div className="flex items-center space-x-2 text-blue-600 font-medium cursor-pointer">
              <Calendar size={16}/>
              <span>Aujourd'hui</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-1 py-2 px-3 text-sm bg-white border rounded-md hover:bg-gray-50">
              <Filter size={16}/>
              <span>Filtres</span>
            </button>
            <button className="flex items-center space-x-1 py-2 px-3 text-sm bg-white border rounded-md hover:bg-gray-50">
              <Download size={16}/>
              <span>Exporter</span>
            </button>
            <button className="flex items-center space-x-1 py-2 px-3 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <RefreshCw size={16}/>
              <span>Générer</span>
            </button>
          </div>
        </div>

        {/* Planning */}
        <div className="p-6">
          <div className="bg-white rounded-lg shadow">
            {/* En-tête du planning */}
            <div className="grid grid-cols-6 border-b">
              <div className="p-3 font-medium text-gray-500 border-r">Horaire / Jour</div>
              <div className="p-3 font-medium text-center">Lundi<br />21/04</div>
              <div className="p-3 font-medium text-center">Mardi<br />22/04</div>
              <div className="p-3 font-medium text-center">Mercredi<br />23/04</div>
              <div className="p-3 font-medium text-center">Jeudi<br />24/04</div>
              <div className="p-3 font-medium text-center">Vendredi<br />25/04</div>
            </div>
            
            {/* MATIN */}
            <div className="grid grid-cols-6 border-b">
              <div className="p-3 font-medium text-gray-700 border-r bg-gray-50">Matin<br />8h - 13h</div>
              
              {/* Ligne du planning pour le matin */}
              <div className="p-2 border-r">
                <div className="grid grid-cols-1 gap-2">
                  {/* Salle 1 */}
                  <div className="rounded p-2 bg-blue-100 border-l-4 border-blue-600">
                    <div className="text-xs font-semibold text-blue-800">Salle 1 - Orthopédie</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs">Dr. Martin</div>
                      <div className="bg-blue-200 text-blue-800 text-xs px-1 rounded">Anesthésie</div>
                    </div>
                  </div>
                  
                  {/* Salle 2 */}
                  <div className="rounded p-2 bg-blue-100 border-l-4 border-blue-600">
                    <div className="text-xs font-semibold text-blue-800">Salle 2 - Orthopédie</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs">IADE Durand</div>
                      <div className="bg-yellow-200 text-yellow-800 text-xs px-1 rounded">Supervision</div>
                    </div>
                  </div>
                  
                  {/* Alerte */}
                  <div className="flex items-center space-x-1 text-amber-600 text-xs">
                    <AlertTriangle size={12}/>
                    <span>Supervision exceptionnelle</span>
                  </div>
                </div>
              </div>
              
              {/* Autres jours */}
              <div className="p-2 border-r">
                <div className="grid grid-cols-1 gap-2">
                  <div className="rounded p-2 bg-green-100 border-l-4 border-green-600">
                    <div className="text-xs font-semibold text-green-800">Salle 5 - Digestive</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs">Dr. Petit</div>
                      <div className="bg-green-200 text-green-800 text-xs px-1 rounded">Anesthésie</div>
                    </div>
                  </div>
                  <div className="rounded p-2 bg-green-100 border-l-4 border-green-600">
                    <div className="text-xs font-semibold text-green-800">Salle 6 - Urologie</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs">IADE Lambert</div>
                      <div className="bg-yellow-200 text-yellow-800 text-xs px-1 rounded">Supervision</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-2 border-r">
                <div className="grid grid-cols-1 gap-2">
                  <div className="rounded p-2 bg-pink-100 border-l-4 border-pink-600">
                    <div className="text-xs font-semibold text-pink-800">Ophta 1 - Dr. Morin</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs">Dr. Dubois</div>
                      <div className="bg-pink-200 text-pink-800 text-xs px-1 rounded">Anesthésie</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-2 border-r">
                <div className="grid grid-cols-1 gap-2">
                  <div className="rounded p-2 bg-orange-100 border-l-4 border-orange-600">
                    <div className="text-xs font-semibold text-orange-800">Salle 10 - ORL</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs">Dr. Legrand</div>
                      <div className="bg-orange-200 text-orange-800 text-xs px-1 rounded">Anesthésie</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-2">
                <div className="grid grid-cols-1 gap-2">
                  <div className="rounded p-2 bg-purple-100 border-l-4 border-purple-600">
                    <div className="text-xs font-semibold text-purple-800">Consultation 1</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs">Dr. Dupont</div>
                    </div>
                  </div>
                  <div className="rounded p-2 bg-purple-100 border-l-4 border-purple-600">
                    <div className="text-xs font-semibold text-purple-800">Consultation 2</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs">Dr. Rousseau</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* APRÈS-MIDI */}
            <div className="grid grid-cols-6">
              <div className="p-3 font-medium text-gray-700 border-r bg-gray-50">Après-midi<br />13h - 18h30</div>
              
              {/* Ligne du planning pour l'après-midi */}
              <div className="p-2 border-r">
                <div className="grid grid-cols-1 gap-2">
                  <div className="rounded p-2 bg-blue-50 border-l-4 border-blue-400">
                    <div className="text-xs font-semibold text-blue-700">Salle 1 - Orthopédie</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs">Dr. Martin</div>
                      <div className="bg-blue-100 text-blue-700 text-xs px-1 rounded">Anesthésie</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-2 border-r">
                <div className="grid grid-cols-1 gap-2">
                  <div className="rounded p-2 bg-indigo-100 border-l-4 border-indigo-600">
                    <div className="text-xs font-semibold text-indigo-800">Garde</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs">Dr. Moreau</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-2 border-r">
                <div className="grid grid-cols-1 gap-2">
                  <div className="rounded p-2 bg-pink-50 border-l-4 border-pink-400">
                    <div className="text-xs font-semibold text-pink-700">Ophta 2 - Dr. Morin</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs">Dr. Dubois</div>
                      <div className="bg-pink-100 text-pink-700 text-xs px-1 rounded">Anesthésie</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-2 border-r">
                <div className="grid grid-cols-1 gap-2">
                  <div className="rounded p-2 bg-cyan-100 border-l-4 border-cyan-600">
                    <div className="text-xs font-semibold text-cyan-800">Endo 1 - Dr. Blanc</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs">IADE Thomas</div>
                      <div className="bg-yellow-200 text-yellow-800 text-xs px-1 rounded">Supervision</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-2">
                <div className="grid grid-cols-1 gap-2">
                  <div className="rounded p-2 bg-indigo-50 border-l-4 border-indigo-400">
                    <div className="text-xs font-semibold text-indigo-700">Astreinte</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs">Dr. Petit</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Légende */}
          <div className="mt-4 bg-white rounded-lg shadow p-4">
            <h3 className="font-medium text-sm mb-2">Légende</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span className="text-xs">Salles 1-4</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-600 rounded"></div>
                <span className="text-xs">Salles 5-8</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-600 rounded"></div>
                <span className="text-xs">Salles 9-12B</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-pink-600 rounded"></div>
                <span className="text-xs">Ophtalmologie</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-cyan-600 rounded"></div>
                <span className="text-xs">Endoscopie</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Barre d'état */}
      <footer className="bg-white border-t p-3 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          <span className="font-medium">16 MARs</span> · <span className="font-medium">9 IADEs</span>
        </div>
        <div className="text-sm flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-green-600">
            <Check size={16}/>
            <span>Planning complet</span>
          </div>
          <div className="text-gray-500">Dernière mise à jour: 18/04/2025</div>
        </div>
      </footer>
    </div>);
};
export default PlanningInterface;
