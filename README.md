# FinCo

Application de comptabilité financière et de contrôle de gestion, avec un backend Spring Boot, un frontend React et une base MySQL.

## Démarrage local

Prérequis : JDK 21, Maven, Node.js et MySQL 8.

1. Créer le schéma avec `mysql -u root -p < database/finco_db.sql`. Attention : ce script supprime puis recrée la base `finco_db` si elle existe déjà.
2. Dans PowerShell, définir le mot de passe MySQL : `$env:DB_PASSWORD="votre-mot-de-passe"`. `DB_USERNAME` vaut `root` par défaut; `DB_URL` peut remplacer l’URL locale.
3. Démarrer le backend depuis `backend` avec `mvn spring-boot:run`.
4. Démarrer le frontend depuis `frontend` avec `npm install` puis `npm run dev`.

L’API de contrôle est disponible sur http://localhost:8080/api/test et renvoie `Backend Spring Boot opérationnel`. La page d’accueil sur http://localhost:5173 affiche aussi l’état de connexion au backend.