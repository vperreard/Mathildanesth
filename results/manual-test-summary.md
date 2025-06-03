# Rapport de Test Manuel Automatisé

## 📅 Date: 03/06/2025 07:45:06

## 📊 Résumé
- **Erreurs totales**: 38
- **Warnings totaux**: 0
- **Erreurs réseau**: 9
- **Parcours testés**: 10

## ❌ Erreurs Critiques
- **/**: Refused to execute script from 'http://localhost:3000/_next/static/css/lib-src_app_globals_css-9ddc9a6a.css?v=1748929442550' because its MIME type ('text/css') is not executable, and strict MIME type checking is enabled.
- **/**: Refused to execute script from 'http://localhost:3000/_next/static/css/vendor-node_modules_n.css?v=1748929442550' because its MIME type ('text/css') is not executable, and strict MIME type checking is enabled.
- **/**: Failed to load resource: the server responded with a status of 401 (Unauthorized)
- **/auth/connexion**: Refused to execute script from 'http://localhost:3000/_next/static/css/lib-src_app_globals_css-9ddc9a6a.css?v=1748929447970' because its MIME type ('text/css') is not executable, and strict MIME type checking is enabled.
- **/auth/connexion**: Refused to execute script from 'http://localhost:3000/_next/static/css/vendor-node_modules_n.css?v=1748929447970' because its MIME type ('text/css') is not executable, and strict MIME type checking is enabled.
- **/auth/connexion**: Failed to load resource: the server responded with a status of 401 (Unauthorized)
- **/planning**: Refused to execute script from 'http://localhost:3000/_next/static/css/lib-n.css?v=1748929454988' because its MIME type ('text/css') is not executable, and strict MIME type checking is enabled.
- **/planning**: Refused to execute script from 'http://localhost:3000/_next/static/css/vendor-node_modules_n.css?v=1748929454988' because its MIME type ('text/css') is not executable, and strict MIME type checking is enabled.
- **/planning**: Failed to load resource: the server responded with a status of 401 (Unauthorized)
- **/conges**: Refused to execute script from 'http://localhost:3000/_next/static/css/lib-n.css?v=1748929460955' because its MIME type ('text/css') is not executable, and strict MIME type checking is enabled.

## ⚠️ Warnings Principaux
Aucun warning

## 🌐 Erreurs Réseau
- **/**: http://localhost:3000/api/auth/me - net::ERR_ABORTED
- **/auth/connexion**: http://localhost:3000/api/auth/me - net::ERR_ABORTED
- **/planning**: http://localhost:3000/api/auth/me - net::ERR_ABORTED
- **/conges**: http://localhost:3000/api/auth/me - net::ERR_ABORTED
- **/admin**: http://localhost:3000/api/auth/me - net::ERR_ABORTED

## 🎯 Prochaines Actions
1. Corriger les erreurs critiques en priorité
2. Investiguer les erreurs réseau
3. Réduire les warnings console

---
*Rapport généré automatiquement - Ne modifie aucun code source*
