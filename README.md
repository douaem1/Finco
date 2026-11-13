# FinCo

Application de comptabilité financière et de contrôle de gestion, avec un backend Spring Boot, un frontend React et une base MySQL.

## Espaces de l’application

- **Comptabilité financière** : journal, saisie des écritures, tiers, factures comptabilisées, paiements et grand livre/balance.
- **Contrôle de gestion** : centres de coûts avec clés de répartition, budgets, ventilation des charges auxiliaires et rapports analytiques.
- **Administration** : plan comptable et gestion des utilisateurs.
- **Direction financière** : tableau de bord et validation des paiements.

## Démarrage local

Prérequis : JDK 21, Maven, Node.js et MySQL 8.

1. Créer le schéma avec `mysql -u root -p < database/finco_db.sql`. Attention : ce script supprime puis recrée la base `finco_db` si elle existe déjà.
2. Dans PowerShell, définir le mot de passe MySQL : `$env:DB_PASSWORD="votre-mot-de-passe"`. `DB_USERNAME` vaut `root` par défaut; `DB_URL` peut remplacer l’URL locale.
3. Démarrer le backend depuis `backend` avec `mvn spring-boot:run`.
4. Démarrer le frontend depuis `frontend` avec `npm install` puis `npm run dev`.

L’API de contrôle est disponible sur http://localhost:8081/api/test et renvoie `Backend Spring Boot opérationnel`. La page d’accueil sur http://localhost:5173 affiche aussi l’état de connexion au backend.

### Envoi des emails en local (Gmail)

Sans SMTP configuré, le code OTP est affiché dans les logs du backend. Pour envoyer les emails :

1. Copier `backend/src/main/resources/application-local.properties.example` vers `backend/src/main/resources/application-local.properties` (ce dernier fichier est ignoré par Git).
2. Dans PowerShell, définir l’adresse Gmail et un **mot de passe d’application Google** (pas le mot de passe normal du compte) :
   ```powershell
   $env:MAIL_USERNAME = "votre-adresse@gmail.com"
   $env:MAIL_PASSWORD = "votre-mot-de-passe-application"
   ```
   Pour personnaliser l’adresse d’expédition, définir aussi `$env:MAIL_FROM`.
3. Démarrer le backend depuis `backend` avec `mvn spring-boot:run`. Le fichier local SMTP est chargé automatiquement s’il existe.

Ces variables ne sont définies que dans la session PowerShell courante. Sans fichier local SMTP configuré, le backend conserve le mode développement et affiche les OTP dans sa console.