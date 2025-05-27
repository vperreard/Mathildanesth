import { redirect } from 'next/navigation';

export default function AdminSecteursPage() {
    // Redirection vers la nouvelle structure unifiée
    redirect('/bloc-operatoire/secteurs');
} 