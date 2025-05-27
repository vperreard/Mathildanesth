import { redirect } from 'next/navigation';

export default function AdminSallesPage() {
    // Redirection vers la nouvelle structure unifiée
    redirect('/bloc-operatoire/salles');
} 