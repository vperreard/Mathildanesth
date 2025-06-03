import { Metadata } from 'next';
import Link from 'next/link';
import { 
  CalendarDays, 
  Building2, 
  Layout, 
  Shield, 
  Grid3X3,
  Activity,
  Clock,
  Users,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Bloc Opératoire - Vue d\'ensemble | Mathildanesth',
  description: 'Tableau de bord et gestion complète du bloc opératoire',
};

const features = [
  {
    title: 'Planning',
    description: 'Gérez le planning du bloc opératoire avec vue jour, semaine et mois',
    icon: CalendarDays,
    href: '/bloc-operatoire/planning',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Salles d\'opération',
    description: 'Configurez et gérez les salles d\'opération et leurs équipements',
    icon: Building2,
    href: '/bloc-operatoire/salles',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    title: 'Secteurs',
    description: 'Organisez les secteurs et spécialités du bloc',
    icon: Layout,
    href: '/bloc-operatoire/secteurs',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    adminOnly: true,
  },
  {
    title: 'Règles de supervision',
    description: 'Définissez les règles de supervision et contraintes',
    icon: Shield,
    href: '/bloc-operatoire/regles',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    adminOnly: true,
  },
  {
    title: 'TrameModeles',
    description: 'Créez des templates de planning réutilisables',
    icon: Grid3X3,
    href: '/bloc-operatoire/trameModeles',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    title: 'Sites d\'anesthésie',
    description: 'Gérez les différents sites d\'anesthésie',
    icon: MapPin,
    href: '/parametres/sites',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    adminOnly: true,
  },
];

const stats = [
  { name: 'Salles actives', value: '12', icon: Building2 },
  { name: 'Chirurgiens', value: '45', icon: Users },
  { name: 'Opérations/jour', value: '32', icon: Activity },
  { name: 'Taux occupation', value: '87%', icon: Clock },
];

export default function BlocOperatoirePage() {
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bloc Opératoire</h1>
        <p className="mt-2 text-lg text-gray-600">
          Gérez l'ensemble des activités du bloc opératoire
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Fonctionnalités */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`inline-flex p-3 rounded-lg ${feature.bgColor}`}>
                  <Icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle className="mt-4">{feature.title}</CardTitle>
                {feature.adminOnly && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Admin
                  </span>
                )}
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {feature.description}
                </CardDescription>
                <Link href={feature.href}>
                  <Button variant="outline" className="w-full">
                    Accéder
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>
            Accédez rapidement aux fonctions les plus utilisées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link href="/bloc-operatoire/planning/create">
              <Button variant="outline" size="sm">
                <CalendarDays className="mr-2 h-4 w-4" />
                Nouveau planning
              </Button>
            </Link>
            <Link href="/bloc-operatoire/salles/nouveau">
              <Button variant="outline" size="sm">
                <Building2 className="mr-2 h-4 w-4" />
                Ajouter une salle
              </Button>
            </Link>
            <Link href="/bloc-operatoire/trameModeles/nouveau">
              <Button variant="outline" size="sm">
                <Grid3X3 className="mr-2 h-4 w-4" />
                Créer une trameModele
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}