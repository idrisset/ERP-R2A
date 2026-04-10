# R2A Industrie - Gestion de Stock - PRD

## Problème Original
Application professionnelle de gestion de stock et gestion commerciale pour R2A Industrie (pièces de rechange industrielles). Application interne en français, responsive PC/mobile, avec authentification sécurisée.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Base de données**: MongoDB
- **Auth**: JWT Bearer tokens (localStorage)
- **Design**: IBM Plex Sans, palette bleu R2A (#0A3D73), thème light

## Utilisateurs
- **Administrateur**: accès complet (CRUD produits, clients, ventes, paramètres)
- **Employé**: accès consultation et opérations courantes

## Ce qui est implémenté (Étape 1 - 10/04/2026)
- [x] Authentification JWT complète (login, register, me, logout, refresh, brute force)
- [x] Page de connexion professionnelle avec image industrielle
- [x] Dashboard avec 5 cartes statistiques
- [x] Grille de 14 tuiles cliquables (12 familles + Ventes + Clients)
- [x] Sidebar navigation responsive
- [x] Menu utilisateur avec dropdown
- [x] Seed admin automatique

## Ce qui est implémenté (Étape 2 - 10/04/2026)
- [x] CRUD Produits complet (créer, modifier, archiver, restaurer)
- [x] Formulaire produit avec tous les champs (référence, nom, catégorie, quantité, prix, fournisseur, emplacement, marque, état, statut)
- [x] Référence produit unique obligatoire
- [x] Recherche instantanée par référence, nom, marque, fournisseur
- [x] Pagination serveur (50/page)
- [x] Corbeille (soft delete) avec restauration
- [x] Page corbeille dédiée
- [x] Page "Tous les Produits" (vue globale cross-catégories)
- [x] Tableau responsive avec colonnes adaptatives (mobile/desktop)
- [x] Structure réutilisable pour les 12 catégories
- [x] Dashboard stats dynamiques (total, stock faible, rupture)

## Backlog Prioritaire

### P0 - Critique
- Gestion des produits (CRUD complet avec tous les champs)
- Import Excel/CSV (1000+ lignes, détection doublons, prévisualisation)
- Recherche instantanée (référence, nom, marque)

### P1 - Important
- Gestion des clients (CRUD + historique achats)
- Gestion des ventes (création rapide, réduction, mise à jour stock)
- Tableau de bord avancé (graphiques, périodes)
- Export Excel (produits, ventes)

### P2 - Souhaitable
- Corbeille avec restauration (produits, clients)
- Pagination optimisée (50/page)
- Journal d'activité complet
- Notifications stock faible
- Modèle téléchargeable fichier Excel
- Historique des imports

## Prochaines étapes
1. Gestion complète des produits par catégorie
2. Import Excel/CSV avec prévisualisation
3. Recherche ultra-rapide
4. Gestion clients et ventes
