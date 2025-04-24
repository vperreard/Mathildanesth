# Composants UI pour Mathildanesth

Cette bibliothèque de composants UI réutilisables est conçue pour offrir une expérience utilisateur cohérente dans toute l'application Mathildanesth.

## Installation des dépendances

Les composants UI utilisent les packages suivants:
```bash
npm install class-variance-authority clsx tailwind-merge
```

## Utilisation

Importez les composants depuis `@/components/ui`:

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Badge, Table } from '@/components/ui';
```

## Composants disponibles

### Button

Bouton avec différentes variantes et états:

```tsx
<Button>Bouton par défaut</Button>
<Button variant="secondary">Bouton secondaire</Button>
<Button variant="outline">Bouton outline</Button>
<Button isLoading>Chargement...</Button>
<Button size="sm">Petit</Button>
<Button size="lg">Grand</Button>
<Button fullWidth>Pleine largeur</Button>
```

### Card

Carte pour afficher du contenu structuré:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Titre de la carte</CardTitle>
    <CardDescription>Description optionnelle</CardDescription>
  </CardHeader>
  <CardContent>
    Contenu principal de la carte
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

Variantes:
```tsx
<Card variant="outline">...</Card>
<Card variant="filled">...</Card>
<Card variant="elevated">...</Card>
```

### Input

Champ de saisie avec étiquette et gestion d'erreur:

```tsx
<Input 
  label="Nom d'utilisateur" 
  placeholder="Entrez votre nom" 
  id="username"
/>

<Input 
  label="Email" 
  type="email" 
  error="Email invalide"
  fullWidth
/>
```

### Table

Tableau pour afficher des données structurées:

```tsx
<Table striped hover bordered>
  <TableHeader>
    <TableRow>
      <TableHead>Nom</TableHead>
      <TableHead>Email</TableHead>
      <TableHead sortable sorted="asc">Date</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Marie Dupont</TableCell>
      <TableCell>marie@example.com</TableCell>
      <TableCell>01/05/2023</TableCell>
      <TableCell>
        <Button size="sm">Éditer</Button>
      </TableCell>
    </TableRow>
    <TableRow selected>
      <TableCell>Jean Martin</TableCell>
      <TableCell>jean@example.com</TableCell>
      <TableCell>15/06/2023</TableCell>
      <TableCell>
        <Button size="sm">Éditer</Button>
      </TableCell>
    </TableRow>
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colSpan={4}>Total: 2 utilisateurs</TableCell>
    </TableRow>
  </TableFooter>
</Table>
```

### Badge

Badge pour afficher des statuts et étiquettes:

```tsx
<Badge>Par défaut</Badge>
<Badge variant="success">Succès</Badge>
<Badge variant="danger">Erreur</Badge>
<Badge variant="warning">Attention</Badge>
<Badge variant="info">Information</Badge>
<Badge dotted>Actif</Badge>
<Badge outline>Outline</Badge>
<Badge removable onRemove={() => console.log('Badge supprimé')}>Supprimable</Badge>
```

## Utilitaires

### cn

Fonction utilitaire pour fusionner les classes Tailwind sans conflits:

```tsx
import { cn } from '@/components/ui';

<div className={cn(
  "base-class", 
  condition && "conditional-class",
  "override-class"
)}>
  Contenu
</div>
``` 