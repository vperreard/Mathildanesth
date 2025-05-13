'use client'; // Les pages de rapport sont souvent interactives

import React from 'react';
import RoomUsageReportPageClient from '@/modules/analytics/components/RoomUsageReportPage'; // Renommé pour clarté

/**
 * Page pour afficher le rapport d'utilisation des salles d'opération.
 * Ce composant serveur simple enveloppe le composant client qui contient la logique principale.
 */
export default function RoomUsageReportServerPage() {
    // Ce composant pourrait être utilisé pour passer des données initiales récupérées côté serveur si nécessaire à l'avenir,
    // mais pour l'instant, toute la logique de récupération de données est dans le composant client.
    return <RoomUsageReportPageClient />;
}

// Métadonnées de la page (optionnel, pour le SEO et le titre de l'onglet)
// import { Metadata } from 'next';
// export const metadata: Metadata = {
// title: 'Rapport d'Utilisation des Salles',
// description: 'Visualisez les statistiques d'utilisation des salles d'opération.',
// }; 