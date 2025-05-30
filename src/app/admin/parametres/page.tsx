import { redirect } from 'next/navigation';

/**
 * REDIRECTION AUTOMATIQUE
 * 
 * Cette page a été fusionnée dans le panneau unifié de configuration
 * Redirection automatique vers la nouvelle interface
 */
export default function AdminSettingsPage() {
    redirect('/admin/configuration');
} 