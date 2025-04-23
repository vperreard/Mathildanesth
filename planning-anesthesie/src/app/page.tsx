export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-100">
      <h1 className="text-4xl font-bold mb-8 text-blue-600">Planning Anesthésie</h1>
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-semibold mb-4">Tableau de bord</h2>
        <p className="mb-4">Application de gestion des plannings pour l'équipe d'anesthésie.</p>
        <div className="mt-6">
          <a
            href="/utilisateurs"
            className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Voir les utilisateurs
          </a>
        </div>
      </div>
    </div>
  );
}
