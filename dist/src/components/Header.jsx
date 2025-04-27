'use client';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function () { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Menu, X, Loader2 } from 'lucide-react';
import AdminRequestsBanner from './AdminRequestsBanner';

// Définition des animations
const fadeIn = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const stagger = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

// Sous-composants modulaires
const Logo = () => (
    <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
                <span className="text-white font-bold text-xl">M</span>
            </div>
            <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent transition-all duration-300 transform group-hover:translate-x-1">Mathildanesth</h1>
        </Link>
    </motion.div>
);

const DesktopNavigation = ({ navLinks, isAdmin }) => (
    <motion.nav className="hidden md:flex space-x-1" initial="hidden" animate="visible" variants={stagger}>
        {navLinks.map(link => (
            <motion.div key={link.href} variants={fadeIn}>
                {(!link.href.includes('/parametres') || isAdmin) && (
                    <Link href={link.href} className="px-4 py-2 text-gray-700 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all duration-200 font-medium text-sm">
                        {link.label}
                    </Link>
                )}
            </motion.div>
        ))}
    </motion.nav>
);

const MobileMenuButton = ({ mobileMenuOpen, setMobileMenuOpen }) => (
    <div className="flex md:hidden">
        <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
        >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
    </div>
);

const UserProfile = ({ user, logout }) => (
    <div className="relative group">
        <div className="flex items-center space-x-2 bg-primary-50 py-1.5 px-3 rounded-full cursor-pointer hover:bg-primary-100 transition-all duration-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white text-sm font-bold">
                {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <span className="text-sm text-gray-700 font-medium">{user.prenom} {user.nom}</span>
        </div>

        {/* Menu déroulant au survol */}
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden transform scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 z-50 border border-gray-100">
            <div className="py-2">
                <Link href="/profil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Mon profil
                    </div>
                </Link>
                <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors">
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Déconnexion
                    </div>
                </button>
            </div>
        </div>
    </div>
);

const LoginForm = ({
    loginInput,
    setLoginInput,
    password,
    setPassword,
    handleLoginSubmit,
    loginError,
    isLoggingIn
}) => (
    <form onSubmit={handleLoginSubmit} className="flex items-center space-x-2">
        {loginError && (
            <div className="absolute top-full right-0 mt-1 text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-100 shadow-md z-10">
                {loginError}
            </div>
        )}
        <div className="flex flex-col space-y-1">
            <div>
                <input
                    type="text"
                    id="login"
                    aria-label="Login"
                    value={loginInput}
                    onChange={e => setLoginInput(e.target.value.toLowerCase())}
                    className="w-32 px-3 py-1 border border-gray-300 rounded-md text-sm"
                    placeholder="Login"
                    required
                />
            </div>
            <div>
                <input
                    type="password"
                    id="password"
                    aria-label="Mot de passe"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-32 px-3 py-1 border border-gray-300 rounded-md text-sm"
                    placeholder="Mot de passe"
                    required
                />
            </div>
        </div>
        <button
            type="submit"
            disabled={isLoggingIn}
            aria-label="Se connecter"
            className="flex items-center justify-center p-2 text-sm bg-gradient-to-r from-primary-500 to-secondary-600 text-white rounded-md shadow-sm hover:shadow-md h-full"
        >
            {isLoggingIn ?
                (<Loader2 className="w-4 h-4 animate-spin" />) :
                (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>)
            }
        </button>
    </form>
);

const MobileNavigation = ({
    mobileMenuOpen,
    isLoading,
    user,
    navLinks,
    setMobileMenuOpen,
    logout,
    loginInput,
    setLoginInput,
    password,
    setPassword,
    handleLoginSubmit,
    loginError,
    isLoggingIn
}) => (
    mobileMenuOpen && (
        <motion.div
            className="md:hidden border-t border-gray-100 bg-white shadow-lg"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="px-4 py-3 space-y-1">
                {!isLoading && user && navLinks.map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all duration-200 font-medium text-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        {link.label}
                    </Link>
                ))}

                {user && (
                    <div className="pt-2 border-t border-gray-100 mt-2">
                        <div className="flex items-center space-x-2 px-3 py-2 bg-primary-50 rounded-lg mb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white text-sm font-bold">
                                {user.prenom?.[0]}{user.nom?.[0]}
                            </div>
                            <span className="text-sm text-gray-700 font-medium">{user.prenom} {user.nom}</span>
                        </div>
                        <Link
                            href="/profil"
                            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all duration-200"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Mon profil
                        </Link>
                        <button
                            onClick={() => { logout(); setMobileMenuOpen(false); }}
                            className="w-full text-left flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 transition-all duration-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Déconnexion
                        </button>
                    </div>
                )}

                {!user && !isLoading && (
                    <div className="pt-2 border-t border-gray-100 mt-2">
                        <form onSubmit={handleLoginSubmit} className="space-y-3 p-3">
                            {loginError && (
                                <div className="text-sm text-red-500 bg-red-50 p-2 rounded-md">
                                    {loginError}
                                </div>
                            )}
                            <div>
                                <label htmlFor="mobileLogin" className="block text-sm font-medium text-gray-700 mb-1">Login</label>
                                <input
                                    type="text"
                                    id="mobileLogin"
                                    value={loginInput}
                                    onChange={e => setLoginInput(e.target.value.toLowerCase())}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    placeholder="ex: vperreard"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="mobilePassword" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                                <input
                                    type="password"
                                    id="mobilePassword"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoggingIn}
                                className="w-full py-2 text-sm bg-gradient-to-r from-primary-500 to-secondary-600 text-white rounded-md shadow-sm hover:shadow-md"
                            >
                                {isLoggingIn ? (
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                        Connexion...
                                    </div>
                                ) : ('Se connecter')}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </motion.div>
    )
);

export default function Header() {
    const { user, logout, isLoading, login } = useAuth();

    // États pour la navigation mobile
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // États pour le formulaire de connexion
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Déterminer si l'utilisateur est un admin (total ou partiel)
    const isAdmin = user && (user.role === 'ADMIN_TOTAL' || user.role === 'ADMIN_PARTIEL');

    const navLinks = [
        { href: '/', label: 'Accueil' },
        { href: '/planning/hebdomadaire', label: 'Planning' },
        { href: '/calendar', label: 'Calendrier' },
        { href: '/leaves', label: 'Congés' },
        { href: '/statistiques', label: 'Statistiques' },
        ...(isAdmin ? [{ href: '/parametres', label: 'Paramètres' }] : [])
    ];

    // Gestion de la soumission du formulaire de connexion
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError(null);
        setIsLoggingIn(true);

        try {
            await login({ login: loginInput, password });
            setLoginInput('');
            setPassword('');
        } catch (err) {
            setLoginError(err.message || 'Échec de la connexion');
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <>
            <header className="bg-white/90 backdrop-blur-lg shadow-soft sticky top-0 z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <Logo />

                        {/* Desktop Navigation */}
                        {!isLoading && user && (
                            <DesktopNavigation navLinks={navLinks} isAdmin={isAdmin} />
                        )}

                        {/* Mobile menu button */}
                        <MobileMenuButton
                            mobileMenuOpen={mobileMenuOpen}
                            setMobileMenuOpen={setMobileMenuOpen}
                        />

                        {/* User section */}
                        <motion.div className="hidden md:flex items-center" initial="hidden" animate="visible" variants={fadeIn}>
                            {isLoading ? (
                                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                            ) : user ? (
                                <UserProfile user={user} logout={logout} />
                            ) : (
                                <LoginForm
                                    loginInput={loginInput}
                                    setLoginInput={setLoginInput}
                                    password={password}
                                    setPassword={setPassword}
                                    handleLoginSubmit={handleLoginSubmit}
                                    loginError={loginError}
                                    isLoggingIn={isLoggingIn}
                                />
                            )}
                        </motion.div>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation */}
            <MobileNavigation
                mobileMenuOpen={mobileMenuOpen}
                isLoading={isLoading}
                user={user}
                navLinks={navLinks}
                setMobileMenuOpen={setMobileMenuOpen}
                logout={logout}
                loginInput={loginInput}
                setLoginInput={setLoginInput}
                password={password}
                setPassword={setPassword}
                handleLoginSubmit={handleLoginSubmit}
                loginError={loginError}
                isLoggingIn={isLoggingIn}
            />

            {/* Bannière admin pour les demandes en attente */}
            {user && isAdmin && <AdminRequestsBanner />}
        </>
    );
}
