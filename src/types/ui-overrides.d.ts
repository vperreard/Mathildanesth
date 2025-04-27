// Déclarations de type pour étendre les composants UI
import { ButtonProps } from '@/components/ui/button';
import { BadgeProps } from '@/components/ui/badge';

// Extension des variantes de boutons pour accepter les variantes "default" et "destructive"
declare module '@/components/ui/button' {
    interface ButtonProps {
        variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'default' | 'destructive';
    }
}

// Extension des variantes de badges pour accepter la variante "destructive"
declare module '@/components/ui/badge' {
    interface BadgeProps {
        variant?: 'default' | 'outline' | 'secondary' | 'tertiary' | 'success' | 'info' | 'warning' | 'danger' | 'gray' | 'destructive';
    }
}

// Correction pour les types d'intervalle dans RulesConfiguration
declare module '@/types/rules' {
    interface RulesConfiguration {
        intervalle: {
            minJoursEntreGardes: number;
            minJoursRecommandes: number;
            maxGardesMois: number;
            maxGardesConsecutives: number;
        };
    }

    type PartialRulesConfiguration = {
        [K in keyof RulesConfiguration]?: Partial<RulesConfiguration[K]>;
    };
} 