'use client';

export default function Footer() {
    return (
        <footer className="bg-white/90 backdrop-blur-sm mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center text-gray-600">
                    <p>© {new Date().getFullYear()} Mathildanesth. Tous droits réservés.</p>
                </div>
            </div>
        </footer>
    );
} 