import { conflictDetectionFacade } from './conflictDetectionFacade';
import { leaveConflictDetectionService } from './leaveConflictDetectionService';
import { shiftConflictDetectionService } from '@/modules/planning/services/shiftConflictDetectionService';

// Enregistrer les services de détection de conflits auprès de la façade
conflictDetectionFacade.registerDetectionService(leaveConflictDetectionService);
conflictDetectionFacade.registerDetectionService(shiftConflictDetectionService);

// Exporter la façade et les services pour faciliter l'importation
export {
    conflictDetectionFacade,
    leaveConflictDetectionService,
    shiftConflictDetectionService
};

// Ré-exporter les types pour faciliter leur utilisation
export type {
    ConflictDetectionService,
    ConflictCheckOptions,
    GlobalConflictCheckResult
} from './conflictDetectionFacade'; 