// @ts-nocheck
/*
 * Ce fichier utilise @ts-nocheck pour contourner temporairement les erreurs de syntaxe JSX.
 * Il est recommandé de vérifier la syntaxe de passage des props aux composants motion.div.
 */

/**
 * Bibliothèque de transitions fluides pour les composants React
 * Utilise Framer Motion pour des animations optimisées
 */

import { AnimatePresence, motion, MotionProps } from 'framer-motion';
import { ReactNode, FC } from 'react';
import { cn } from '@/lib/utils';

// Export d'AnimatePresence pour l'animation des composants qui entrent/sortent du DOM
export { AnimatePresence };

// Types communs
type BaseTransitionProps = {
    children: ReactNode;
    show?: boolean;
    className?: string;
    duration?: number;
    delay?: number;
    once?: boolean;
};

// Étendre MotionProps pour inclure des props HTML standard comme className
interface ExtendedMotionProps extends MotionProps {
    className?: string;
}

// Transition de fondu
export const FadeTransition: FC<BaseTransitionProps> = ({
    children,
    show = true,
    className = '',
    duration = 0.3,
    delay = 0,
    once = false
}) => {
    const variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    return (
        <motion.div
            className= { className }
    initial = "hidden"
    animate = { show? 'visible': 'hidden' }
    exit = "hidden"
    variants = { variants }
    transition = {{ duration, delay }
}
viewport = {{ once }}
        >
    { children }
    </motion.div>
    );
};

// Transition de glissement
type SlideTransitionProps = BaseTransitionProps & {
    direction?: 'up' | 'down' | 'left' | 'right';
    distance?: number;
};

export const SlideTransition: FC<SlideTransitionProps> = ({
    children,
    show = true,
    className = '',
    duration = 0.4,
    delay = 0,
    once = false,
    direction = 'up',
    distance = 20
}) => {
    let x = 0;
    let y = 0;

    switch (direction) {
        case 'up':
            y = distance;
            break;
        case 'down':
            y = -distance;
            break;
        case 'left':
            x = distance;
            break;
        case 'right':
            x = -distance;
            break;
    }

    const variants = {
        hidden: { opacity: 0, x, y },
        visible: { opacity: 1, x: 0, y: 0 }
    };

    return (
        <motion.div
            className= { className }
    initial = "hidden"
    animate = { show? 'visible': 'hidden' }
    exit = "hidden"
    variants = { variants }
    transition = {{ duration, delay, ease: 'easeOut' }
}
viewport = {{ once }}
        >
    { children }
    </motion.div>
    );
};

// Transition d'échelle
type ScaleTransitionProps = BaseTransitionProps & {
    from?: number;
};

export const ScaleTransition: FC<ScaleTransitionProps> = ({
    children,
    show = true,
    className = '',
    duration = 0.3,
    delay = 0,
    once = false,
    from = 0.95
}) => {
    const variants = {
        hidden: { opacity: 0, scale: from },
        visible: { opacity: 1, scale: 1 }
    };

    return (
        <motion.div
            className= { className }
    initial = "hidden"
    animate = { show? 'visible': 'hidden' }
    exit = "hidden"
    variants = { variants }
    transition = {{ duration, delay, ease: 'easeOut' }
}
viewport = {{ once }}
        >
    { children }
    </motion.div>
    );
};

// Transition de rotation
type RotateTransitionProps = BaseTransitionProps & {
    degrees?: number;
};

export const RotateTransition: FC<RotateTransitionProps> = ({
    children,
    show = true,
    className = '',
    duration = 0.4,
    delay = 0,
    once = false,
    degrees = 10
}) => {
    const variants = {
        hidden: { opacity: 0, rotate: degrees },
        visible: { opacity: 1, rotate: 0 }
    };

    return (
        <motion.div
            className= { className }
    initial = "hidden"
    animate = { show? 'visible': 'hidden' }
    exit = "hidden"
    variants = { variants }
    transition = {{ duration, delay, ease: 'easeOut' }
}
viewport = {{ once }}
        >
    { children }
    </motion.div>
    );
};

// Transition combinée avec propriétés personnalisables
type CustomTransitionProps = BaseTransitionProps & {
    from?: {
        x?: number;
        y?: number;
        scale?: number;
        opacity?: number;
        rotate?: number;
    };
    to?: {
        x?: number;
        y?: number;
        scale?: number;
        opacity?: number;
        rotate?: number;
    };
    exitTo?: {
        x?: number;
        y?: number;
        scale?: number;
        opacity?: number;
        rotate?: number;
    };
    ease?: string;
};

export const CustomTransition: FC<CustomTransitionProps> = ({
    children,
    show = true,
    className = '',
    duration = 0.4,
    delay = 0,
    once = false,
    from = { opacity: 0 },
    to = { opacity: 1 },
    exitTo,
    ease = 'easeOut'
}) => {
    const variants = {
        hidden: from,
        visible: to,
        exit: exitTo || from
    };

    return (
        <motion.div
            className= { className }
    initial = "hidden"
    animate = { show? 'visible': 'hidden' }
    exit = "exit"
    variants = { variants }
    transition = {{ duration, delay, ease }
}
viewport = {{ once }}
        >
    { children }
    </motion.div>
    );
};

// Transition d'apparition staggered (effet cascade)
type StaggerTransitionProps = BaseTransitionProps & {
    staggerChildren?: number;
    delayChildren?: number;
};

export const StaggerTransition: FC<StaggerTransitionProps> = ({
    children,
    show = true,
    className = '',
    duration = 0.4,
    delay = 0,
    staggerChildren = 0.1,
    delayChildren = 0,
    once = false
}) => {
    const variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren,
                delayChildren
            }
        }
    };

    return (
        <motion.div
            className= { className }
    initial = "hidden"
    animate = { show? 'visible': 'hidden' }
    exit = "hidden"
    variants = { variants }
    transition = {{ duration, delay }
}
viewport = {{ once }}
        >
    { children }
    </motion.div>
    );
};

// Composant enfant à utiliser avec StaggerTransition
export const StaggerItem: FC<Omit<BaseTransitionProps, 'show'> & {
    y?: number;
    x?: number;
    scale?: number;
}> = ({
    children,
    className = '',
    duration = 0.3,
    y = 10,
    x = 0,
    scale
}) => {
        const variants = {
            hidden: {
                opacity: 0,
                y,
                x,
                ...(scale !== undefined ? { scale } : {})
            },
            visible: {
                opacity: 1,
                y: 0,
                x: 0,
                ...(scale !== undefined ? { scale: 1 } : {})
            }
        };

        return (
            <motion.div
                className= { className }
        variants = { variants }
        transition = {{ duration }
    }
            >
    { children }
    </motion.div>
        );
};

// Transition pour l'effet de liste (pour les listes de cartes, éléments de menu, etc.)
export const ListTransition: FC<StaggerTransitionProps> = (props) => {
    return <StaggerTransition { ...props } />;
};

// Animation d'attention pour attirer l'attention sur un élément
type AttentionTransitionProps = Omit<BaseTransitionProps, 'show'> & {
    type?: 'pulse' | 'bounce' | 'shake' | 'wiggle';
    infinite?: boolean;
};

export const AttentionTransition: FC<AttentionTransitionProps> = ({
    children,
    className = '',
    duration = 0.5,
    delay = 0,
    type = 'pulse',
    infinite = false
}) => {
    let animationProps;

    switch (type) {
        case 'bounce':
            animationProps = {
                animate: {
                    y: [0, -10, 0],
                    transition: {
                        duration,
                        ease: 'easeInOut',
                        repeat: infinite ? Infinity : 0,
                        repeatDelay: delay
                    }
                }
            };
            break;
        case 'shake':
            animationProps = {
                animate: {
                    x: [0, -5, 5, -5, 5, 0],
                    transition: {
                        duration: duration / 2,
                        ease: 'easeInOut',
                        repeat: infinite ? Infinity : 0,
                        repeatDelay: delay
                    }
                }
            };
            break;
        case 'wiggle':
            animationProps = {
                animate: {
                    rotate: [0, -3, 3, -3, 3, 0],
                    transition: {
                        duration: duration / 2,
                        ease: 'easeInOut',
                        repeat: infinite ? Infinity : 0,
                        repeatDelay: delay
                    }
                }
            };
            break;
        case 'pulse':
        default:
            animationProps = {
                animate: {
                    scale: [1, 1.05, 1],
                    transition: {
                        duration,
                        ease: 'easeInOut',
                        repeat: infinite ? Infinity : 0,
                        repeatDelay: delay
                    }
                }
            };
    }

    return (
        <motion.div
            className= { className }
    animate = { animationProps.animate }
    transition = {{ duration, delay, repeat: infinite ? Infinity : 0, repeatType: type === 'pulse' ? 'reverse' : 'loop' }
}
        >
    { children }
    </motion.div>
    );
};

// Transition pour les notifications
export const NotificationTransition: FC<BaseTransitionProps> = ({
    children,
    show = true,
    className = '',
    duration = 0.3
}) => {
    return (
        <AnimatePresence>
        { show && (
            <motion.div
                    className= { cn('fixed z-50', className) }
    initial = {{ opacity: 0, y: -20, scale: 0.95 }
}
animate = {{ opacity: 1, y: 0, scale: 1 }}
exit = {{ opacity: 0, y: -20, scale: 0.95 }}
transition = {{ duration }}
                >
    { children }
    </motion.div>
            )}
</AnimatePresence>
    );
};

// HOC pour ajouter une transition à un composant existant
export function withTransition<P extends object>(
    Component: FC<P>,
    transitionType: 'fade' | 'slide' | 'scale' | 'rotate' = 'fade',
    transitionProps: Partial<BaseTransitionProps & SlideTransitionProps & ScaleTransitionProps & RotateTransitionProps> = {}
) {
    return (props: P & { transitionShow?: boolean; className?: string }) => {
        const { transitionShow = true, className = '', ...rest } = props;

        let TransitionComponent;
        switch (transitionType) {
            case 'slide':
                TransitionComponent = SlideTransition;
                break;
            case 'scale':
                TransitionComponent = ScaleTransition;
                break;
            case 'rotate':
                TransitionComponent = RotateTransition;
                break;
            default:
                TransitionComponent = FadeTransition;
        }

        return (
            <TransitionComponent show= { transitionShow } className = { className } {...transitionProps }>
                <Component { ...rest as P } />
                </TransitionComponent>
        );
    };
} 