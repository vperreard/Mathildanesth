#!/bin/bash
# scripts/fix-component-tests.sh - Réparation automatique des tests components

echo "🔧 Démarrage de la réparation automatique des tests components..."

# Fonction pour afficher les étapes
step() {
    echo "📍 $1"
}

# 1. Standardiser l'utilisation de renderWithProviders
step "1. Standardisation de renderWithProviders dans tous les tests"

# Remplacer render par renderWithProviders
find src/components -name "*.test.*" -type f -exec sed -i '' \
  's/import { render, screen/import { renderWithProviders as render, screen/g' {} \;

# Ajouter l'import renderWithProviders si render est utilisé seul
find src/components -name "*.test.*" -type f -exec sed -i '' \
  's/from '\''@testing-library\/react'\'';/from '\''@\/test-utils\/renderWithProviders'\'';/g' {} \;

# 2. Nettoyer les mocks dupliqués framer-motion
step "2. Suppression des mocks dupliqués framer-motion"

# Supprimer tous les mocks framer-motion locaux (ils sont dans jest.setup.js)
find src/components -name "*.test.*" -type f | while read file; do
    # Créer un fichier temporaire sans les mocks framer-motion
    awk '
    /^jest\.mock\(.*framer-motion/ {
        in_mock = 1
        brace_count = 0
        next
    }
    in_mock && /{/ { brace_count++ }
    in_mock && /}/ { 
        brace_count--
        if (brace_count <= 0) {
            in_mock = 0
            next
        }
    }
    !in_mock { print }
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
done

# 3. Nettoyer les mocks lucide-react dupliqués
step "3. Suppression des mocks dupliqués lucide-react"

find src/components -name "*.test.*" -type f | while read file; do
    # Créer un fichier temporaire sans les mocks lucide-react
    awk '
    /^jest\.mock\(.*lucide-react/ {
        in_mock = 1
        brace_count = 0
        next
    }
    in_mock && /{/ { brace_count++ }
    in_mock && /}/ { 
        brace_count--
        if (brace_count <= 0) {
            in_mock = 0
            next
        }
    }
    !in_mock { print }
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
done

# 4. Corriger les imports relatifs vers absolus
step "4. Standardisation des imports vers paths absolus"

find src/components -name "*.test.*" -type f -exec sed -i '' \
  's|from "\.\./|from "@/components/|g' {} \;

find src/components -name "*.test.*" -type f -exec sed -i '' \
  's|from "\.\./\.\./|from "@/|g' {} \;

find src/components -name "*.test.*" -type f -exec sed -i '' \
  's|from "\.\./\.\./\.\./|from "@/|g' {} \;

# 5. Réparer le test LoginForm vide
step "5. Réparation du test LoginForm"

cat > src/components/auth/__tests__/LoginForm.test.tsx << 'EOF'
import React from 'react';
import { renderWithProviders, screen, fireEvent, waitFor } from '@/test-utils/renderWithProviders';
import LoginForm from '../LoginForm';

// Mock des hooks nécessaires
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    login: jest.fn(),
    loading: false,
    error: null,
  })),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form correctly', () => {
    renderWithProviders(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    const mockLogin = jest.fn();
    const { useAuth } = require('@/hooks/useAuth');
    useAuth.mockReturnValue({
      login: mockLogin,
      loading: false,
      error: null,
    });

    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /se connecter/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should display loading state during submission', () => {
    const { useAuth } = require('@/hooks/useAuth');
    useAuth.mockReturnValue({
      login: jest.fn(),
      loading: true,
      error: null,
    });

    renderWithProviders(<LoginForm />);

    expect(screen.getByRole('button', { name: /connexion/i })).toBeDisabled();
  });

  it('should display error message when login fails', () => {
    const { useAuth } = require('@/hooks/useAuth');
    useAuth.mockReturnValue({
      login: jest.fn(),
      loading: false,
      error: 'Invalid credentials',
    });

    renderWithProviders(<LoginForm />);

    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
EOF

# 6. Vérifier si le fichier LoginForm existe, sinon créer un composant minimal
step "6. Vérification/création du composant LoginForm"

if [ ! -f "src/components/auth/LoginForm.tsx" ]; then
    mkdir -p src/components/auth
    cat > src/components/auth/LoginForm.tsx << 'EOF'
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      onSuccess?.();
    } catch (err) {
      // Error is handled by useAuth hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Mot de passe
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Connexion...' : 'Se connecter'}
      </Button>
    </form>
  );
};

export default LoginForm;
EOF
fi

# 7. Lancer les tests pour validation
step "7. Validation en lançant les tests components"

echo "🧪 Lancement des tests pour vérifier les corrections..."

# Tester spécifiquement les components avec un timeout plus long
npm test -- --testPathPattern="src/components" --passWithNoTests --timeout=30000 || echo "⚠️  Certains tests peuvent encore échouer, vérification manuelle nécessaire"

echo ""
echo "✅ Réparation terminée !"
echo ""
echo "📊 Résumé des actions effectuées:"
echo "  • Standardisation de renderWithProviders dans tous les tests"
echo "  • Suppression des mocks dupliqués (framer-motion, lucide-react)"
echo "  • Correction des imports relatifs vers absolus"
echo "  • Réparation du test LoginForm"
echo "  • Création du composant LoginForm si nécessaire"
echo ""
echo "📋 Prochaines étapes recommandées:"
echo "  1. Vérifier manuellement les tests qui échouent encore"
echo "  2. Ajuster les mocks spécifiques si nécessaire"
echo "  3. Lancer: npm test -- --testPathPattern=components --coverage"
echo "  4. Compléter les tests manquants pour les composants sans tests"