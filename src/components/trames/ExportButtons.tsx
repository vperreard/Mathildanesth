/**
 * Composant de boutons d'export pour les trames
 * Permet l'export en PDF et Excel avec options configurables
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, FileSpreadsheet, FileText, Settings } from 'lucide-react';
import { TrameExportService, ExportOptions, TrameExportData } from '@/services/trameExportService';
import { toastManager } from '@/lib/toast-manager';

interface ExportButtonsProps {
  trameName: string;
  site: string;
  weekType: string;
  rooms: Array<{
    id: string;
    name: string;
    sector: string;
  }>;
  affectations: Array<{
    roomId: string;
    dayOfWeek: number;
    period: string;
    activityType: string;
    personnel: Array<{
      name: string;
      role: string;
    }>;
    isActive: boolean;
    weekType: string;
  }>;
  disabled?: boolean;
}

export function ExportButtons({
  trameName,
  site,
  weekType,
  rooms,
  affectations,
  disabled = false,
}: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includePersonnel: true,
    includeInactive: false,
    weekType: 'ALL',
  });

  const exportService = new TrameExportService();

  const handleQuickExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    try {
      const data: TrameExportData = {
        trameName,
        site,
        weekType,
        rooms,
        affectations,
      };

      await exportService.exportTrame(data, {
        ...exportOptions,
        format,
      });
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAdvancedExport = async () => {
    setShowOptions(false);
    setIsExporting(true);
    
    try {
      const data: TrameExportData = {
        trameName,
        site,
        weekType,
        rooms,
        affectations,
      };

      await exportService.exportTrame(data, exportOptions);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || isExporting}
            className="text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            {isExporting ? 'Export...' : 'Exporter'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Export rapide</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={() => handleQuickExport('pdf')}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Export PDF</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleQuickExport('excel')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            <span>Export Excel</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowOptions(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Options avancées...</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog des options avancées */}
      <Dialog open={showOptions} onOpenChange={setShowOptions}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Options d'export</DialogTitle>
            <DialogDescription>
              Configurez les options pour votre export
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Format d'export */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Format d'export</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {exportOptions.format === 'pdf' ? (
                      <>
                        <FileText className="h-4 w-4" />
                        <span>PDF</span>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>Excel</span>
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuRadioGroup
                    value={exportOptions.format}
                    onValueChange={(value) =>
                      setExportOptions({ ...exportOptions, format: value as 'pdf' | 'excel' })
                    }
                  >
                    <DropdownMenuRadioItem value="pdf">
                      <FileText className="mr-2 h-4 w-4" />
                      PDF (pour impression)
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="excel">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel (pour analyse)
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Options de contenu */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Contenu à inclure</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includePersonnel}
                    onChange={(e) =>
                      setExportOptions({ ...exportOptions, includePersonnel: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Inclure le personnel assigné</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeInactive}
                    onChange={(e) =>
                      setExportOptions({ ...exportOptions, includeInactive: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Inclure les affectations inactives</span>
                </label>
              </div>
            </div>

            {/* Type de semaine */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type de semaine</label>
              <select
                value={exportOptions.weekType}
                onChange={(e) =>
                  setExportOptions({ ...exportOptions, weekType: e.target.value as any })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="ALL">Toutes les semaines</option>
                <option value="EVEN">Semaines paires uniquement</option>
                <option value="ODD">Semaines impaires uniquement</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOptions(false)}>
              Annuler
            </Button>
            <Button onClick={handleAdvancedExport} disabled={isExporting}>
              {isExporting ? 'Export en cours...' : 'Exporter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}