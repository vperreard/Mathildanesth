/**
 * Fichier centralisant les imports optimisés pour éviter l'import de bibliothèques entières
 * Utiliser ces exports plutôt que d'importer directement depuis les packages
 */

// Lucide React - Importer seulement les icônes utilisées
export {
    Calendar,
    CalendarDays,
    CalendarPlus,
    CalendarX,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Clock,
    Edit,
    Edit2,
    Eye,
    EyeOff,
    Filter,
    Home,
    Info,
    Loader2,
    LogOut,
    Menu,
    MoreHorizontal,
    MoreVertical,
    Plus,
    Save,
    Search,
    Settings,
    Trash2,
    User,
    Users,
    X,
    Check,
    AlertCircle,
    AlertTriangle,
    Bell,
    BellOff,
    Download,
    Upload,
    RefreshCw,
    Activity,
    BarChart,
    PieChart,
    TrendingUp,
    TrendingDown,
    Building,
    Briefcase,
    Heart,
    Star,
    Copy,
    Clipboard,
    Mail,
    Phone,
    MapPin,
    Globe,
    Lock,
    Unlock,
    Shield,
    ShieldCheck,
    FileText,
    File,
    Folder,
    FolderOpen,
    Database,
    Server,
    Cpu,
    Monitor,
    Smartphone,
    Tablet,
    type LucideIcon,
} from 'lucide-react';

// Date-fns - Importer seulement les fonctions utilisées
export {
    format,
    formatDistance,
    formatDistanceToNow,
    formatRelative,
    parseISO,
    parse,
    isValid,
    isToday,
    isTomorrow,
    isYesterday,
    isPast,
    isFuture,
    isWithinInterval,
    isSameDay,
    isSameMonth,
    isSameYear,
    isBefore,
    isAfter,
    isEqual,
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    addDays,
    addWeeks,
    addMonths,
    addYears,
    subDays,
    subWeeks,
    subMonths,
    subYears,
    differenceInDays,
    differenceInWeeks,
    differenceInMonths,
    differenceInYears,
    differenceInCalendarDays,
    eachDayOfInterval,
    eachWeekOfInterval,
    eachMonthOfInterval,
    getDay,
    getMonth,
    getYear,
    setHours,
    setMinutes,
    setSeconds,
    getHours,
    getMinutes,
    getSeconds,
} from 'date-fns';

// Locale date-fns pour le français
export { fr } from 'date-fns/locale';

// React Query - Exports optimisés
export {
    useQuery,
    useMutation,
    useQueryClient,
    useInfiniteQuery,
    QueryClient,
    QueryClientProvider,
    type UseQueryResult,
    type UseMutationResult,
    type UseInfiniteQueryResult,
} from '@tanstack/react-query';

// React Hook Form - Exports optimisés
export {
    useForm,
    useFormContext,
    useFieldArray,
    useWatch,
    Controller,
    FormProvider,
    type UseFormReturn,
    type FieldValues,
    type SubmitHandler,
    type Control,
    type UseFormProps,
    type RegisterOptions,
    type FieldErrors,
} from 'react-hook-form';

// Zod - Exports optimisés
export {
    z,
    type ZodError,
    type ZodSchema,
    type ZodType,
    type infer as ZodInfer,
} from 'zod';

// Utilitaire pour lazy loading conditionnel
export const lazyWithPreload = <T extends React.ComponentType<any>>(
    factory: () => Promise<{ default: T }>
) => {
    const Component = React.lazy(factory);
    (Component as any).preload = factory;
    return Component;
};

// Hook pour précharger les composants
export const usePreloadComponent = (component: any) => {
    React.useEffect(() => {
        if (component.preload) {
            component.preload();
        }
    }, [component]);
};