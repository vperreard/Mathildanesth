'use client';

import React from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';

type MedicalButtonVariant = 'guard' | 'oncall' | 'vacation' | 'rest' | 'emergency' | 'outline' | 'ghost';
type MedicalButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'icon';

interface MedicalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: MedicalButtonVariant;
  size?: MedicalButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantConfig = {
  guard: 'btn-guard',
  oncall: 'btn-oncall', 
  vacation: 'btn-vacation',
  rest: 'btn-rest',
  emergency: 'btn-medical bg-medical-emergency-500 text-white hover:bg-medical-emergency-600 focus:ring-medical-emergency-500 active:bg-medical-emergency-700',
  outline: 'btn-medical border-2 border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
  ghost: 'btn-medical bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
};

const sizeConfig = {
  sm: 'btn-medical-sm text-sm px-3 py-2',
  md: 'btn-medical text-base px-4 py-3',
  lg: 'btn-medical-lg text-lg px-6 py-4',
  xl: 'btn-medical text-xl px-8 py-5 min-h-[56px]',
  icon: 'btn-medical p-3 min-w-[44px] aspect-square'
};

export function MedicalButton({
  variant = 'vacation',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}: MedicalButtonProps) {
  const variantClasses = variantConfig[variant];
  const sizeClasses = sizeConfig[size];
  
  const isDisabled = disabled || loading;
  
  const buttonContent = (
    <>
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
      
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className={`w-4 h-4 ${size === 'icon' ? '' : 'mr-2'}`} />
      )}
      
      {size !== 'icon' && (
        <span className={loading ? 'ml-2' : ''}>
          {children}
        </span>
      )}
      
      {!loading && Icon && iconPosition === 'right' && size !== 'icon' && (
        <Icon className="w-4 h-4 ml-2" />
      )}
    </>
  );

  return (
    <button
      className={`
        ${variantClasses}
        ${sizeClasses}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        flex items-center justify-center
        focus-medical touch-target
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {buttonContent}
    </button>
  );
}

// Composants spécialisés pour différents contextes médicaux
interface ActionButtonProps extends Omit<MedicalButtonProps, 'variant'> {
  urgent?: boolean;
}

export function GuardButton({ urgent, ...props }: ActionButtonProps) {
  return (
    <MedicalButton 
      {...props} 
      variant={urgent ? 'emergency' : 'guard'} 
    />
  );
}

export function OnCallButton(props: Omit<MedicalButtonProps, 'variant'>) {
  return <MedicalButton {...props} variant="oncall" />;
}

export function VacationButton(props: Omit<MedicalButtonProps, 'variant'>) {
  return <MedicalButton {...props} variant="vacation" />;
}

export function RestButton(props: Omit<MedicalButtonProps, 'variant'>) {
  return <MedicalButton {...props} variant="rest" />;
}

export function EmergencyButton(props: Omit<MedicalButtonProps, 'variant'>) {
  return <MedicalButton {...props} variant="emergency" />;
}

// Boutons d'action rapide pour mobile
interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  count?: number;
  variant?: MedicalButtonVariant;
  onClick?: () => void;
  className?: string;
}

export function QuickActionButton({
  icon: Icon,
  label,
  count,
  variant = 'vacation',
  onClick,
  className = ''
}: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center
        p-4 min-h-[80px] rounded-medical-lg
        transition-all duration-200
        touch-target focus-medical
        ${variant === 'guard' ? 'bg-medical-guard-50 text-medical-guard-700 hover:bg-medical-guard-100' : ''}
        ${variant === 'oncall' ? 'bg-medical-oncall-50 text-medical-oncall-700 hover:bg-medical-oncall-100' : ''}
        ${variant === 'vacation' ? 'bg-medical-vacation-50 text-medical-vacation-700 hover:bg-medical-vacation-100' : ''}
        ${variant === 'rest' ? 'bg-medical-rest-50 text-medical-rest-700 hover:bg-medical-rest-100' : ''}
        ${className}
      `}
    >
      <div className="relative">
        <Icon className="w-6 h-6 mb-2" />
        {count !== undefined && count > 0 && (
          <div className="absolute -top-1 -right-1 bg-medical-guard-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-medium">
            {count > 99 ? '99+' : count}
          </div>
        )}
      </div>
      <span className="text-sm font-medium text-center line-clamp-2">
        {label}
      </span>
    </button>
  );
}

export default MedicalButton;