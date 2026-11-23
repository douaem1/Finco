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

1. Copier `backend/src/main/resources/application-local.properties.example` vers `backend/src/main/resources/application-local.properties` si ce fichier n’existe pas déjà (il est ignoré par Git).
2. Dans `backend/.env`, renseigner `MAIL_USERNAME` et `MAIL_PASSWORD`. Le mot de passe doit être un **mot de passe d’application Google**, pas le mot de passe normal du compte. Ce fichier est ignoré par Git ; ne partagez pas son contenu. Pour personnaliser l’adresse d’expédition, renseigner aussi `MAIL_FROM`.
3. Démarrer le backend avec `backend/run-local.cmd`. Le script active le profil `local`.

Avec le SMTP configuré, FinCo envoie aussi des notifications lors de la création d'une facture, de l'approbation d'un paiement, du règlement complet d'une facture et de la validation d'une écriture comptable. Les notifications destinées aux clients ou fournisseurs utilisent l'adresse email renseignée sur leur fiche. Un email manquant ou un incident SMTP est journalisé sans annuler l'opération comptable.

Le profil `local` configure le transport Gmail ; sans SMTP valide, les OTP continuent d’apparaître dans les logs du backend.

### Assistant FinCo (Gemini)

Le chatbot est disponible dans les espaces employés une fois la clé Gemini configurée côté backend.

Pour une configuration locale, renseignez `backend/.env` :

```properties
GEMINI_API_KEY=votre-cle-api-gemini
GEMINI_MODEL=gemini-2.5-flash
```

Ce fichier est ignoré par Git. Vous pouvez aussi définir les variables dans PowerShell :

```powershell
$env:GEMINI_API_KEY = "votre-cle-api-gemini"
$env:GEMINI_MODEL = "gemini-2.5-flash" # facultatif
```

Redémarrer ensuite le backend. Les messages du chat sont envoyés à Gemini pour générer les réponses, mais l'assistant ne lit aucune donnée enregistrée dans FinCo et ne conserve pas l'historique côté serveur. Ne saisissez pas de données personnelles ou financières sensibles.