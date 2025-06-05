'use client';

import React, { useState } from 'react';
import { logger } from "../lib/logger";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  FileSpreadsheet,
  FileText,
  FileJson,
  Download,
  Filter,
  Calendar,
  Columns,
  SortAsc,
  X,
  Loader2
} from 'lucide-react';
import { ExportOptions, AdvancedExportService } from '@/services/advancedExportService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any[];
  title?: string;
  defaultColumns?: string[];
  entityType?: 'users' | 'leaves' | 'planning' | 'custom';
  onExport?: (blob: Blob, fileName: string) => void;
}

export function ExportDialog({
  open,
  onOpenChange,
  data,
  title = 'Exporter les données',
  defaultColumns,
  entityType = 'custom',
  onExport
}: ExportDialogProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // Options d'export
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf' | 'json'>('excel');
  const [fileName, setFileName] = useState('');
  const [includeMetadata, setIncludeMetadata] = useState(true);

  // Filtres
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});

  // Colonnes
  const [availableColumns] = useState(() => {
    if (defaultColumns) return defaultColumns;
    if (data.length === 0) return [];
    return AdvancedExportService['extractHeaders'](data[0]);
  });
  const [selectedColumns, setSelectedColumns] = useState<string[]>(availableColumns);

  // Tri
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Présets par type d'entité
  const getDefaultFileName = () => {
    const date = format(new Date(), 'yyyy-MM-dd');
    switch (entityType) {
      case 'users':
        return `utilisateurs_${date}`;
      case 'leaves':
        return `conges_${date}`;
      case 'planning':
        return `planning_${date}`;
      default:
        return `export_${date}`;
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const options: ExportOptions = {
        format: exportFormat,
        fileName: fileName || getDefaultFileName(),
        columns: selectedColumns.length > 0 ? selectedColumns : undefined,
        includeMetadata,
        filters: selectedFilters,
        dateRange: dateRange.start && dateRange.end ? {
          start: dateRange.start,
          end: dateRange.end
        } : undefined,
        sortBy: sortBy || undefined,
        sortOrder
      };

      const blob = await AdvancedExportService.export(data, options);
      
      if (onExport) {
        onExport(blob, `${options.fileName}.${exportFormat}`);
      } else {
        // Téléchargement automatique
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${options.fileName}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast({
        title: 'Export réussi',
        description: `Les données ont été exportées au format ${exportFormat.toUpperCase()}.`,
      });

      onOpenChange(false);
    } catch (error) {
      logger.error('Export error:', error);
      toast({
        title: 'Erreur d\'export',
        description: 'Une erreur est survenue lors de l\'export des données.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const toggleColumn = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  const formatIcons = {
    csv: <FileText className="h-5 w-5" />,
    excel: <FileSpreadsheet className="h-5 w-5" />,
    pdf: <FileText className="h-5 w-5" />,
    json: <FileJson className="h-5 w-5" />
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Configurez les options d'export pour vos données
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="format" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="filters">Filtres</TabsTrigger>
            <TabsTrigger value="columns">Colonnes</TabsTrigger>
            <TabsTrigger value="sort">Tri</TabsTrigger>
          </TabsList>

          <TabsContent value="format" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Format d'export</Label>
                <RadioGroup
                  value={exportFormat}
                  onValueChange={(value) => setExportFormat(value as any)}
                  className="mt-2 grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="csv" id="csv" />
                    <Label htmlFor="csv" className="cursor-pointer flex items-center gap-2">
                      {formatIcons.csv}
                      <div>
                        <div className="font-medium">CSV</div>
                        <div className="text-sm text-gray-500">Compatible avec tous les tableurs</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="excel" id="excel" />
                    <Label htmlFor="excel" className="cursor-pointer flex items-center gap-2">
                      {formatIcons.excel}
                      <div>
                        <div className="font-medium">Excel</div>
                        <div className="text-sm text-gray-500">Format natif Microsoft Excel</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="pdf" id="pdf" />
                    <Label htmlFor="pdf" className="cursor-pointer flex items-center gap-2">
                      {formatIcons.pdf}
                      <div>
                        <div className="font-medium">PDF</div>
                        <div className="text-sm text-gray-500">Pour l'impression et l'archivage</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="json" id="json" />
                    <Label htmlFor="json" className="cursor-pointer flex items-center gap-2">
                      {formatIcons.json}
                      <div>
                        <div className="font-medium">JSON</div>
                        <div className="text-sm text-gray-500">Pour l'intégration avec d'autres systèmes</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="fileName">Nom du fichier</Label>
                <Input
                  id="fileName"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder={getDefaultFileName()}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeMetadata"
                  checked={includeMetadata}
                  onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
                />
                <Label htmlFor="includeMetadata" className="cursor-pointer">
                  Inclure les métadonnées (date d'export, filtres appliqués)
                </Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="filters" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Plage de dates
                </Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label className="text-sm">Date de début</Label>
                    <DatePicker
                      date={dateRange.start}
                      onDateChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Date de fin</Label>
                    <DatePicker
                      date={dateRange.end}
                      onDateChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                    />
                  </div>
                </div>
              </div>

              {/* Filtres spécifiques par type d'entité */}
              {entityType === 'users' && (
                <div>
                  <Label>Rôle</Label>
                  <Select
                    value={selectedFilters.role}
                    onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Tous les rôles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les rôles</SelectItem>
                      <SelectItem value="ADMIN_TOTAL">Admin Total</SelectItem>
                      <SelectItem value="ADMIN_PARTIEL">Admin Partiel</SelectItem>
                      <SelectItem value="IADE">IADE</SelectItem>
                      <SelectItem value="MAR">MAR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {entityType === 'leaves' && (
                <div>
                  <Label>Statut</Label>
                  <Select
                    value={selectedFilters.status}
                    onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="PENDING">En attente</SelectItem>
                      <SelectItem value="APPROVED">Approuvé</SelectItem>
                      <SelectItem value="REJECTED">Refusé</SelectItem>
                      <SelectItem value="CANCELLED">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="columns" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Columns className="h-4 w-4" />
                  Colonnes à exporter
                </Label>
                <div className="text-sm text-gray-500">
                  {selectedColumns.length}/{availableColumns.length} sélectionnées
                </div>
              </div>

              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {availableColumns.map((column) => (
                    <div key={column} className="flex items-center space-x-2">
                      <Checkbox
                        id={column}
                        checked={selectedColumns.includes(column)}
                        onCheckedChange={() => toggleColumn(column)}
                      />
                      <Label htmlFor={column} className="cursor-pointer flex-1">
                        {column}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedColumns(availableColumns)}
                >
                  Tout sélectionner
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedColumns([])}
                >
                  Tout désélectionner
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sort" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4" />
                  Trier par
                </Label>
                <Select
                  value={sortBy}
                  onValueChange={setSortBy}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Aucun tri" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun tri</SelectItem>
                    {availableColumns.map((column) => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {sortBy && (
                <div>
                  <Label>Ordre de tri</Label>
                  <RadioGroup
                    value={sortOrder}
                    onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="asc" id="asc" />
                      <Label htmlFor="asc">Croissant (A → Z)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="desc" id="desc" />
                      <Label htmlFor="desc">Décroissant (Z → A)</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-500">
              {data.length} enregistrements à exporter
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting || selectedColumns.length === 0}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Exporter
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}