/**
 * À terme, il devrait être converti en .tsx
 */

import { FC, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Typages de base pour les props de transition
export type BaseTransitionProps = {
    children: ReactNode;
    show?: boolean;
    className?: string;
    duration?: number;
    delay?: number;
    once?: boolean;
};

// Wrapper pour contenir les exports
const Transitions = {
    // Fonction qui génère une transition de fondu
    FadeTransition: function createFadeTransition(props: BaseTransitionProps) {
        const { children, show = true, className = '', duration = 0.3, delay = 0, once = false } = props;

        // Dans un fichier TS, nous retournons simplement une description de ce qui serait rendu
        return {
            type: 'FadeTransition',
            props: {
                className,
                initial: "hidden",
                animate: show ? 'visible' : 'hidden',
                exit: "hidden",
                variants: {
                    visible: { opacity: 1 },
                    hidden: { opacity: 0 }
                },
                transition: { duration, delay },
                viewport: { once }
            },
            children
        };
    },

    // Fonction qui génère une transition de glissement
    SlideTransition: function createSlideTransition(props: BaseTransitionProps & { direction?: 'up' | 'down' | 'left' | 'right' }) {
        const {
            children,
            show = true,
            className = '',
            duration = 0.3,
            delay = 0,
            once = false,
            direction = 'up'
        } = props;

        const offsetMap = {
            up: { y: 20 },
            down: { y: -20 },
            left: { x: 20 },
            right: { x: -20 }
        };

        const offset = offsetMap[direction] || offsetMap.up;

        return {
            type: 'SlideTransition',
            props: {
                className,
                initial: "hidden",
                animate: show ? 'visible' : 'hidden',
                exit: "hidden",
                variants: {
                    visible: { opacity: 1, x: 0, y: 0 },
                    hidden: { opacity: 0, ...offset }
                },
                transition: { duration, delay },
                viewport: { once }
            },
            children
        };
    },

    // Fonction qui génère une transition d'échelle
    ScaleTransition: function createScaleTransition(props: BaseTransitionProps) {
        const {
            children,
            show = true,
            className = '',
            duration = 0.3,
            delay = 0,
            once = false
        } = props;

        return {
            type: 'ScaleTransition',
            props: {
                className,
                initial: "hidden",
                animate: show ? 'visible' : 'hidden',
                exit: "hidden",
                variants: {
                    visible: { opacity: 1, scale: 1 },
                    hidden: { opacity: 0, scale: 0.8 }
                },
                transition: { duration, delay },
                viewport: { once }
            },
            children
        };
    },

    // Export de AnimatePresence
    AnimatePresence: null // Sera remplacé par l'import réel dans le fichier .tsx
};

// Exports individuels pour compatibilité
export const FadeTransition = Transitions.FadeTransition;
export const SlideTransition = Transitions.SlideTransition;
export const ScaleTransition = Transitions.ScaleTransition;

export default Transitions; 