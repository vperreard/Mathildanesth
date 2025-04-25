import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Bell, Settings, Download, Check, RefreshCw, Edit, Eye, Save } from 'lucide-react';
var GardesInterface = function () {
    var _a = useState('Avril 2025'), currentMonth = _a[0], setCurrentMonth = _a[1];
    return (<div className="flex flex-col h-screen bg-gray-50">
      {/* Barre de navigation */}
      <header className="bg-white shadow-sm py-4 px-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="font-bold text-xl text-blue-600">PlanningAnesthésie</div>
            <nav className="hidden md:flex space-x-6 ml-10">
              <a href="#" className="font-medium text-gray-500 hover:text-gray-900">Planning</a>
              <a href="#" className="font-medium text-blue-600 border-b-2 border-blue-600 pb-1">Gardes</a>
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
            <h2 className="font-semibold text-lg">{currentMonth}</h2>
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
              <Eye size={16}/>
              <span>Période: 3 mois</span>
            </button>
            <button className="flex items-center space-x-1 py-2 px-3 text-sm bg-white border rounded-md hover:bg-gray-50">
              <Download size={16}/>
              <span>Exporter</span>
            </button>
            <button className="flex items-center space-x-1 py-2 px-3 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <RefreshCw size={16}/>
              <span>Générer les gardes</span>
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Colonne 1 - Calendrier */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium text-lg mb-4">Calendrier des gardes</h3>
            
            {/* Mini-calendrier */}
            <div className="border rounded">
              <div className="grid grid-cols-7 text-center bg-gray-50 border-b text-xs font-medium py-2">
                <div>Lun</div>
                <div>Mar</div>
                <div>Mer</div>
                <div>Jeu</div>
                <div>Ven</div>
                <div className="text-red-600">Sam</div>
                <div className="text-red-600">Dim</div>
              </div>
              
              <div className="grid grid-cols-7 text-center text-sm">
                <div className="p-2 text-gray-400">31</div>
                <div className="p-2">1</div>
                <div className="p-2">2</div>
                <div className="p-2">3</div>
                <div className="p-2">4</div>
                <div className="p-2 text-red-600 bg-indigo-50 font-medium relative">
                  5
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-indigo-500 rounded-full"></span>
                </div>
                <div className="p-2 text-red-600 bg-indigo-50 font-medium relative">
                  6
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-indigo-500 rounded-full"></span>
                </div>
                
                <div className="p-2">7</div>
                <div className="p-2">8</div>
                <div className="p-2">9</div>
                <div className="p-2">10</div>
                <div className="p-2">11</div>
                <div className="p-2 text-red-600 bg-amber-50 font-medium relative">
                  12
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-amber-500 rounded-full"></span>
                </div>
                <div className="p-2 text-red-600 bg-amber-50 font-medium relative">
                  13
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-amber-500 rounded-full"></span>
                </div>
                
                <div className="p-2">14</div>
                <div className="p-2">15</div>
                <div className="p-2">16</div>
                <div className="p-2">17</div>
                <div className="p-2">18</div>
                <div className="p-2 text-red-600">19</div>
                <div className="p-2 text-red-600 bg-blue-50 font-medium relative">
                  20
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full"></span>
                </div>
                
                <div className="p-2 bg-blue-50 font-medium relative">
                  21
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full"></span>
                </div>
                <div className="p-2">22</div>
                <div className="p-2">23</div>
                <div className="p-2">24</div>
                <div className="p-2">25</div>
                <div className="p-2 text-red-600">26</div>
                <div className="p-2 text-red-600">27</div>
                
                <div className="p-2 ring-2 ring-blue-600 font-medium">28</div>
                <div className="p-2">29</div>
                <div className="p-2">30</div>
                <div className="p-2 text-gray-400">1</div>
                <div className="p-2 text-gray-400">2</div>
                <div className="p-2 text-gray-400 text-red-300">3</div>
                <div className="p-2 text-gray-400 text-red-300">4</div>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Légende</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                  <span>Garde attribuée</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span>Astreinte attribuée</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Garde + Astreinte</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 ring-2 ring-blue-600 bg-white rounded-full"></div>
                  <span>Jour sélectionné</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Colonne 2 - Affectation */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium text-lg mb-4">Affectation du 28 Avril 2025</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="border rounded p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-indigo-700">Garde 24h</h4>
                  <div className="flex space-x-1">
                    <button className="p-1 text-gray-500 hover:text-gray-700">
                      <Edit size={16}/>
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium">ML</div>
                  <div>
                    <div className="font-medium">Dr. Marie Legrand</div>
                    <div className="text-xs text-gray-500">Temps plein</div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mt-3">
                  Gardes précédentes: 19/04 (il y a 9 jours)
                </div>
                <div className="text-xs text-gray-500">
                  Gardes ce mois-ci: 1/3
                </div>
              </div>
              
              <div className="border rounded p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-amber-700">Astreinte 24h</h4>
                  <div className="flex space-x-1">
                    <button className="p-1 text-gray-500 hover:text-gray-700">
                      <Edit size={16}/>
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-medium">TP</div>
                  <div>
                    <div className="font-medium">Dr. Thomas Petit</div>
                    <div className="text-xs text-gray-500">Temps plein</div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mt-3">
                  Astreintes précédentes: 12/04 (il y a 16 jours)
                </div>
                <div className="text-xs text-gray-500">
                  Astreintes ce mois-ci: 1/3
                </div>
              </div>
              
              <div className="border rounded p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-700">Lendemain de garde (29/04)</h4>
                </div>
                
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium">ML</div>
                  <div>
                    <div className="font-medium">Dr. Marie Legrand</div>
                    <div className="text-xs text-gray-500">OFF (après garde)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Colonne 3 - Médecins disponibles */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium text-lg mb-4">MARs disponibles</h3>
            
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-gray-700">Pour garde le 28/04</h4>
              <button className="flex items-center space-x-1 text-sm text-blue-600">
                <Plus size={16}/>
                <span>Ajouter manuellement</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-2 mb-6">
              <div className="border rounded p-3 flex justify-between items-center hover:bg-blue-50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium text-xs">RD</div>
                  <div>
                    <div className="font-medium">Dr. Robert Dubois</div>
                    <div className="text-xs text-gray-500">Dernière garde: 01/04 (il y a 27 jours)</div>
                  </div>
                </div>
                <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Recommandé
                </div>
              </div>
              
              <div className="border rounded p-3 flex justify-between items-center hover:bg-blue-50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-xs">CM</div>
                  <div>
                    <div className="font-medium">Dr. Claire Martin</div>
                    <div className="text-xs text-gray-500">Dernière garde: 05/04 (il y a 23 jours)</div>
                  </div>
                </div>
                <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Éligible
                </div>
              </div>
              
              <div className="border rounded p-3 flex justify-between items-center bg-gray-50 opacity-75">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium text-xs">SB</div>
                  <div>
                    <div className="font-medium">Dr. Sophie Bernard</div>
                    <div className="text-xs text-red-500">Indisponible (congé déclaré)</div>
                  </div>
                </div>
                <div className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full">
                  Non éligible
                </div>
              </div>
              
              <div className="border rounded p-3 flex justify-between items-center bg-gray-50 opacity-75">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium text-xs">LF</div>
                  <div>
                    <div className="font-medium">Dr. Laurent Fabre</div>
                    <div className="text-xs text-red-500">Garde récente (20/04, il y a 8 jours)</div>
                  </div>
                </div>
                <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  Non recommandé
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-gray-700">Pour astreinte le 28/04</h4>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="border rounded p-3 flex justify-between items-center hover:bg-blue-50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium text-xs">JR</div>
                  <div>
                    <div className="font-medium">Dr. Julie Rousseau</div>
                    <div className="text-xs text-gray-500">Dernière astreinte: 02/04 (il y a 26 jours)</div>
                  </div>
                </div>
                <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Recommandé
                </div>
              </div>
              
              <div className="border rounded p-3 flex justify-between items-center hover:bg-blue-50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-xs">PL</div>
                  <div>
                    <div className="font-medium">Dr. Pierre Lemaire</div>
                    <div className="text-xs text-gray-500">Dernière astreinte: 07/04 (il y a 21 jours)</div>
                  </div>
                </div>
                <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Éligible
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Options de génération */}
        <div className="p-6 pt-0">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium text-lg mb-4">Paramètres de génération</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-3">Période</h4>
                <div className="flex items-center space-x-2 mb-2">
                  <input type="radio" name="period" id="period-3" className="h-4 w-4 text-blue-600" checked/>
                  <label htmlFor="period-3">3 mois</label>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <input type="radio" name="period" id="period-4" className="h-4 w-4 text-blue-600"/>
                  <label htmlFor="period-4">4 mois</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="radio" name="period" id="period-custom" className="h-4 w-4 text-blue-600"/>
                  <label htmlFor="period-custom">Personnalisé</label>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Règles de génération</h4>
                <div className="flex items-center space-x-2 mb-2">
                  <input type="checkbox" id="rule-1" className="h-4 w-4 text-blue-600" checked/>
                  <label htmlFor="rule-1">Minimum 7 jours entre gardes</label>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <input type="checkbox" id="rule-2" className="h-4 w-4 text-blue-600" checked/>
                  <label htmlFor="rule-2">Maximum 3 gardes / 30 jours</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="rule-3" className="h-4 w-4 text-blue-600" checked/>
                  <label htmlFor="rule-3">Respecter les indisponibilités</label>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Répartition</h4>
                <div className="flex items-center space-x-2 mb-2">
                  <input type="checkbox" id="dist-1" className="h-4 w-4 text-blue-600" checked/>
                  <label htmlFor="dist-1">Équitable selon temps de travail</label>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <input type="checkbox" id="dist-2" className="h-4 w-4 text-blue-600" checked/>
                  <label htmlFor="dist-2">Conserver les affectations manuelles</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="dist-3" className="h-4 w-4 text-blue-600"/>
                  <label htmlFor="dist-3">Prioriser les weekends non travaillés</label>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button className="flex items-center space-x-2 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <Save size={16}/>
                <span>Enregistrer les paramètres</span>
              </button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Barre d'état */}
      <footer className="bg-white border-t p-3 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          <span className="font-medium">16 MARs actifs</span> · <span className="font-medium">3 congés en cours</span>
        </div>
        <div className="text-sm flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-green-600">
            <Check size={16}/>
            <span>Gardes générées jusqu'au 31/07/2025</span>
          </div>
          <div className="text-gray-500">Dernière mise à jour: 18/04/2025</div>
        </div>
      </footer>
    </div>);
};
export default GardesInterface;
