# FinCo — Documentation des Endpoints de l'API REST

Ce document décrit l'ensemble des endpoints REST disponibles dans l'application **FinCo**, leur contrat d'interface, la matrice de sécurité par rôle, ainsi que le guide pour importer et exécuter la collection Postman fournie.

---

## 1. Démarrage de l'application

### Prérequis
- Java 21 (ou JDK 17 minimum)
- Maven 3.8+
- Node.js 18+ et npm
- MySQL 8 en cours d'exécution sur le port 3306 (base `finco`)

### Démarrage du Backend (port 8081)
Depuis la racine du projet :
```bash
cd backend
mvn spring-boot:run
```
Le backend est accessible sur : `http://localhost:8081`.

### Démarrage du Frontend (port 5173)
Depuis la racine du projet :
```bash
cd frontend
npm install
npm run dev
```
L'application web est accessible sur : `http://localhost:5173`.

---

## 2. Authentification et Récupération des Jetons JWT

FinCo utilise une authentification à deux facteurs :
1. **Étape 1 (`POST /api/auth/login`)** : Saisie de l'email et du mot de passe. Le serveur valide les identifiants et génère un `jetonOtp`.
2. **Étape 2 (`POST /api/auth/verifier-otp`)** : Saisie du code à 6 chiffres.

> **Note relative au code OTP en développement :**
> Si aucun serveur SMTP externe n'est configuré dans `application.properties`, le code OTP à 6 chiffres est automatiquement affiché dans les logs console du backend :
> ```text
> ================================================================
>  [MODE DÉVELOPPEMENT] Aucun serveur email configuré.
>  Code de connexion pour sara@finco.ma : 849201   (valable 5 min)
> ================================================================
> ```
> Il suffit de copier ce code à 6 chiffres pour valider l'étape 2.

### Utilisateurs de démonstration par défaut

| Rôle | Email | Mot de passe | Permissions |
|---|---|---|---|
| **COMPTABLE** | `raissouni.aya@etu.uae.ac.ma` *(ou `comptable@finco.ma`)* | `admin123` | Saisie d'écritures, CRUD Tiers |
| **CONTROLEUR** | `cg@finco.ma` *(ou `controleur@finco.ma`)* | `admin123` | CRUD Centres de coûts |
| **ADMIN** | `admin@finco.ma` | `admin123` | CRUD Plan comptable, Administration |
| **DIRECTEUR_FINANCIER** | `daf@finco.ma` | `admin123` | Consultation Tiers, Journal, Approbation |

---

## 3. Matrice de Sécurité (Contrôle d'accès RBAC)

| Ressource | Méthode | URL | Rôles autorisés |
|---|---|---|---|
| **Auth** | POST | `/api/auth/login` | Public |
| **Auth** | POST | `/api/auth/verifier-otp` | Public |
| **Auth** | POST | `/api/auth/renvoyer-otp` | Public |
| **Tiers (Fournisseurs)** | GET | `/api/fournisseurs` | `COMPTABLE`, `DIRECTEUR_FINANCIER`, `ADMIN` |
| **Tiers (Fournisseurs)** | GET | `/api/fournisseurs/{id}` | `COMPTABLE`, `DIRECTEUR_FINANCIER`, `ADMIN` |
| **Tiers (Fournisseurs)** | POST | `/api/fournisseurs` | `COMPTABLE` |
| **Tiers (Fournisseurs)** | PUT | `/api/fournisseurs/{id}` | `COMPTABLE` |
| **Tiers (Fournisseurs)** | DELETE | `/api/fournisseurs/{id}` | `COMPTABLE` |
| **Tiers (Clients)** | GET | `/api/clients` | `COMPTABLE`, `DIRECTEUR_FINANCIER`, `ADMIN` |
| **Tiers (Clients)** | GET | `/api/clients/{id}` | `COMPTABLE`, `DIRECTEUR_FINANCIER`, `ADMIN` |
| **Tiers (Clients)** | POST | `/api/clients` | `COMPTABLE` |
| **Tiers (Clients)** | PUT | `/api/clients/{id}` | `COMPTABLE` |
| **Tiers (Clients)** | DELETE | `/api/clients/{id}` | `COMPTABLE` |
| **Plan comptable** | GET | `/api/comptes` | Tout utilisateur authentifié |
| **Plan comptable** | GET | `/api/comptes/{id}` | Tout utilisateur authentifié |
| **Plan comptable** | POST | `/api/comptes` | `ADMIN` |
| **Plan comptable** | PUT | `/api/comptes/{id}` | `ADMIN` |
| **Plan comptable** | DELETE | `/api/comptes/{id}` | `ADMIN` |
| **Centres de coûts** | GET | `/api/centres-cout` | Tout utilisateur authentifié |
| **Centres de coûts** | GET | `/api/centres-cout/{id}` | Tout utilisateur authentifié |
| **Centres de coûts** | POST | `/api/centres-cout` | `CONTROLEUR` |
| **Centres de coûts** | PUT | `/api/centres-cout/{id}` | `CONTROLEUR` |
| **Centres de coûts** | DELETE | `/api/centres-cout/{id}` | `CONTROLEUR` |
| **Écritures** | GET | `/api/pieces` | Tout utilisateur authentifié |
| **Écritures** | GET | `/api/pieces/{id}` | Tout utilisateur authentifié |
| **Écritures** | POST | `/api/pieces` | `COMPTABLE`, `ADMIN` |

---

## 4. Spécification détaillée des Endpoints

### 4.1. Tiers — Fournisseurs

#### `GET /api/fournisseurs`
- **Description :** Liste tous les fournisseurs triés par nom.
- **En-tête :** `Authorization: Bearer <tokenComptable>`
- **Succès :** `200 OK`
```json
[
  {
    "id": 1,
    "nom": "Maroc Telecom",
    "ice": "001524368000085",
    "email": "contact@iam.ma",
    "telephone": "0537000000",
    "rib": "011780000012345678901234"
  }
]
```

#### `GET /api/fournisseurs/{id}`
- **Succès :** `200 OK`
- **Erreurs :** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

#### `POST /api/fournisseurs`
- **Description :** Création d'un fournisseur.
- **Rôle :** `COMPTABLE`
- **En-tête :** `Authorization: Bearer <tokenComptable>`, `Content-Type: application/json`
- **Corps :**
```json
{
  "nom": "Fournisseur Alpha SARL",
  "ice": "001524368000085",
  "email": "contact@alpha.ma",
  "telephone": "0522112233",
  "rib": "011780000012345678901234"
}
```
- **Succès :** `201 Created` avec en-tête `Location: /api/fournisseurs/{id}`.
- **Erreurs :**
  - `400 Bad Request` : nom manquant, RIB différent de 24 chiffres, email mal formé.
  - `403 Forbidden` : utilisateur non `COMPTABLE`.

#### `PUT /api/fournisseurs/{id}`
- **Succès :** `200 OK`.
- **Erreurs :** `400 Bad Request`, `404 Not Found`, `403 Forbidden`.

#### `DELETE /api/fournisseurs/{id}`
- **Rôle :** `COMPTABLE`
- **Succès :** `204 No Content`.
- **Erreurs :**
  - `404 Not Found` : fournisseur inexistant.
  - `409 Conflict` : le fournisseur est rattaché à une ou plusieurs factures.
  - `403 Forbidden` : rôle non autorisé.

---

### 4.2. Tiers — Clients

#### `GET /api/clients`
- **Succès :** `200 OK`.

#### `POST /api/clients`
- **Rôle :** `COMPTABLE`
- **Corps :**
```json
{
  "nom": "Atlas Trading SA",
  "ice": "002134567890123",
  "email": "commandes@atlastrading.ma",
  "telephone": "0537889900",
  "plafondCredit": 150000.00
}
```
- **Succès :** `201 Created` avec en-tête `Location: /api/clients/{id}`.
- **Erreurs :**
  - `400 Bad Request` : nom manquant ou plafond de crédit négatif.
  - `403 Forbidden` : utilisateur non `COMPTABLE`.

#### `PUT /api/clients/{id}`
- **Succès :** `200 OK`.
- **Erreurs :** `400 Bad Request`, `404 Not Found`, `403 Forbidden`.

#### `DELETE /api/clients/{id}`
- **Succès :** `204 No Content`.
- **Erreurs :** `404 Not Found`, `409 Conflict` (factures associées), `403 Forbidden`.

---

### 4.3. Plan Comptable (`CompteGeneral`)

#### `GET /api/comptes`
- **Description :** Liste tous les comptes généraux triés par numéro.
- **Succès :** `200 OK`.

#### `POST /api/comptes`
- **Rôle :** `ADMIN`
- **Corps :**
```json
{
  "numero": "6145",
  "libelle": "Frais postaux et de télécommunications"
}
```
- **Succès :** `201 Created` avec en-tête `Location: /api/comptes/{id}`.
- **Réponse :**
```json
{
  "id": 12,
  "numero": "6145",
  "libelle": "Frais postaux et de télécommunications",
  "classe": 6
}
```
- **Règle :** La classe (1 à 8) est automatiquement calculée côté serveur à partir du 1er chiffre.
- **Erreurs :**
  - `400 Bad Request` : numéro invalide (doit comporter de 2 à 10 chiffres et commencer par un chiffre entre 1 et 8).
  - `409 Conflict` : le numéro de compte existe déjà.
  - `403 Forbidden` : rôle différent de `ADMIN`.

#### `PUT /api/comptes/{id}`
- **Rôle :** `ADMIN`
- **Succès :** `200 OK`.
- **Erreurs :**
  - `400 Bad Request` : format invalide.
  - `404 Not Found` : compte inexistant.
  - `409 Conflict` : numéro déjà pris par un autre compte, ou compte déjà utilisé dans des écritures comptables (interdiction de changer le numéro).

#### `DELETE /api/comptes/{id}`
- **Rôle :** `ADMIN`
- **Succès :** `204 No Content`.
- **Erreurs :**
  - `404 Not Found` : compte inexistant.
  - `409 Conflict` : compte utilisé dans au moins une ligne d'écriture.

---

### 4.4. Centres de Coûts (`CentreCout`)

#### `GET /api/centres-cout`
- **Succès :** `200 OK`.

#### `POST /api/centres-cout`
- **Rôle :** `CONTROLEUR`
- **Corps :**
```json
{
  "code": "LOGIST",
  "libelle": "Direction Logistique et Transport",
  "principal": true
}
```
- **Succès :** `201 Created` avec en-tête `Location: /api/centres-cout/{id}`.
- **Erreurs :**
  - `400 Bad Request` : code invalide (doit contenir de 2 à 10 caractères : majuscules, chiffres et underscore).
  - `409 Conflict` : code déjà utilisé.
  - `403 Forbidden` : utilisateur non `CONTROLEUR`.

#### `PUT /api/centres-cout/{id}`
- **Rôle :** `CONTROLEUR`
- **Succès :** `200 OK`.

#### `DELETE /api/centres-cout/{id}`
- **Rôle :** `CONTROLEUR`
- **Succès :** `204 No Content`.
- **Erreurs :**
  - `404 Not Found` : centre inexistant.
  - `409 Conflict` : centre rattaché à une écriture comptable OU disposant d'un budget prévisionnel.

---

## 5. Utilisation de la Collection Postman

Les fichiers de tests Postman se trouvent dans le répertoire `postman/` :
1. `postman/FinCo.postman_collection.json`
2. `postman/FinCo.local.postman_environment.json`

### Importation dans Postman
1. Ouvrez Postman.
2. Cliquez sur le bouton **Import**.
3. Glissez-déposez les deux fichiers JSON ci-dessus.
4. Dans le sélecteur d'environnement en haut à droite, sélectionnez **FinCo - Local (http://localhost:8081)**.

### Exécution du scénario
1. Exécutez les requêtes du dossier `0-Authentification` pour obtenir les jetons `tokenComptable`, `tokenControleur` et `tokenAdmin`.
   *(Remplacez le code OTP par celui affiché dans la console du serveur lors du login).*
2. Vous pouvez ensuite exécuter les dossiers `1-Tiers`, `2-Plan comptable` et `3-Centres de coûts` ou lancer le **Collection Runner** pour exécuter tous les tests d'assertion automatisés.
