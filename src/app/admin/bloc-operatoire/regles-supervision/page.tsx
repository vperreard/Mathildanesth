import { redirect } from 'next/navigation';

export default function AdminReglesSupervisionPage() {
    // Redirection vers la nouvelle structure unifiée
    redirect('/bloc-operatoire/regles');
} 