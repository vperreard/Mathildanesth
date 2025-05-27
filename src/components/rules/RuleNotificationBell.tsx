'use client';

import React, { useState } from 'react';
import { Bell, BellOff, X, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useRuleNotifications } from '@/modules/dynamicRules/hooks/useRuleNotifications';
import { RuleSeverity } from '@/types/rules';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RuleNotificationBellProps {
    className?: string;
    showToasts?: boolean;
    playSound?: boolean;
}

export function RuleNotificationBell({
    className,
    showToasts = true,
    playSound = true
}: RuleNotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    const {
        violations,
        ruleChanges,
        unreadCount,
        connectionStatus,
        acknowledgeViolation,
        clearViolations,
        isConnected
    } = useRuleNotifications({
        showToasts: showToasts && !isMuted,
        playSound: playSound && !isMuted
    });

    const getSeverityIcon = (severity: RuleSeverity) => {
        switch (severity) {
            case RuleSeverity.ERROR:
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case RuleSeverity.WARNING:
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case RuleSeverity.INFO:
                return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    const getSeverityColor = (severity: RuleSeverity) => {
        switch (severity) {
            case RuleSeverity.ERROR:
                return 'text-red-700 bg-red-50';
            case RuleSeverity.WARNING:
                return 'text-yellow-700 bg-yellow-50';
            case RuleSeverity.INFO:
                return 'text-blue-700 bg-blue-50';
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const recentViolations = violations.slice(0, 10);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("relative", className)}
                    title={isConnected ? 'Notifications de règles' : 'Déconnecté'}
                >
                    <Bell className={cn(
                        "h-5 w-5",
                        !isConnected && "text-muted-foreground"
                    )} />
                    
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}

                    {!isConnected && (
                        <div className="absolute bottom-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-96 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notifications de règles</h3>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleMute}
                            className="h-8 w-8"
                            title={isMuted ? 'Activer le son' : 'Couper le son'}
                        >
                            {isMuted ? (
                                <BellOff className="h-4 w-4" />
                            ) : (
                                <Bell className="h-4 w-4" />
                            )}
                        </Button>
                        
                        {violations.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearViolations}
                                className="text-xs"
                            >
                                Tout effacer
                            </Button>
                        )}
                    </div>
                </div>

                {!isConnected && (
                    <div className="p-4 bg-yellow-50 border-b">
                        <p className="text-sm text-yellow-700">
                            Connexion aux notifications interrompue
                        </p>
                    </div>
                )}

                <ScrollArea className="h-[400px]">
                    {recentViolations.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Aucune notification</p>
                            <p className="text-xs mt-1">
                                Les violations de règles apparaîtront ici
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {recentViolations.map((violation) => (
                                <div
                                    key={violation.id}
                                    className={cn(
                                        "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                                        !violation.acknowledged && "bg-muted/30"
                                    )}
                                    onClick={() => acknowledgeViolation(violation.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        {getSeverityIcon(violation.severity)}
                                        
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium">
                                                {violation.ruleName}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {violation.message}
                                            </p>
                                            
                                            {violation.context.userName && (
                                                <p className="text-xs text-muted-foreground">
                                                    Utilisateur: {violation.context.userName}
                                                </p>
                                            )}
                                            
                                            {violation.context.location && (
                                                <p className="text-xs text-muted-foreground">
                                                    Lieu: {violation.context.location}
                                                </p>
                                            )}
                                            
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(violation.timestamp, {
                                                    addSuffix: true,
                                                    locale: fr
                                                })}
                                            </p>
                                        </div>

                                        {!violation.acknowledged && (
                                            <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {violations.length > 10 && (
                    <div className="p-3 border-t bg-muted/50">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                                setIsOpen(false);
                                // Navigation vers la page complète des notifications
                                window.location.href = '/admin/planning-rules/notifications';
                            }}
                        >
                            Voir toutes les notifications ({violations.length})
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}