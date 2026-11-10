# FinCo — Documentation des Endpoints de l'API REST

Ce document décrit l'ensemble des endpoints REST disponibles dans l'application **FinCo**, leur contrat d'interface, la matrice de sécurité par rôle, ainsi que le guide pour importer et exécuter la collection Postman fournie.

---

## 1. Démarrage de l'application

### Prérequis
- Java 21 (ou JDK 17 minimum)
- Maven 3.8+
- Node.js 18+ et npm
- MySQL 8 en cours d'exécution sur le port 3306 (base `finco_db`)

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
> Si le profil `local` n'est pas activé avec une configuration SMTP, le code OTP à 6 chiffres est automatiquement affiché dans les logs console du backend :
> ```text
> ================================================================
>  [MODE DÉVELOPPEMENT] Aucun serveur email configuré.
>  Code de connexion pour sara@finco.ma : 849201   (valable 5 min)
> ================================================================
> ```
> Il suffit de copier ce code à 6 chiffres pour valider l'étape 2.

### Utilisateurs de démonstration par défaut

| Rôle | Email | Mot de passe | Espace (page d'arrivée) |
|---|---|---|---|
| **COMPTABLE** | `comptable@finco.ma` | `admin123` | Journal, saisie, tiers, factures, paiements, grand livre (`/pieces`) |
| **CONTROLEUR** | `controleur@finco.ma` | `admin123` | Centres de coûts, budgets, répartitions, rapports analytiques (`/centres-cout`) |
| **ADMIN** | `admin@finco.ma` | `admin123` | Plan comptable, utilisateurs (`/comptes`) |
| **DIRECTEUR_FINANCIER** | `daf@finco.ma` | `admin123` | Tableau de bord, validation des paiements (`/tableau-de-bord`) |

---

## 3. Matrice de Sécurité (Contrôle d'accès RBAC)

Source de vérité : `SecurityConfig.java` (serveur) et `frontend/src/config/roleAccess.js` (menus et routes).
Un rôle non autorisé reçoit `403 Forbidden` ; une requête sans jeton reçoit `401 Unauthorized`.

| Ressource | Méthode | URL | Rôles autorisés |
|---|---|---|---|
| **Auth** | POST | `/api/auth/login`, `/api/auth/verifier-otp`, `/api/auth/renvoyer-otp` | Public |
| **Auth** | GET | `/api/auth/me` | Tout utilisateur authentifié |
| **Écritures** | GET | `/api/pieces`, `/api/pieces/{id}` | `COMPTABLE`, `DIRECTEUR_FINANCIER` |
| **Écritures** | POST | `/api/pieces` | `COMPTABLE` |
| **Écritures** | PATCH | `/api/pieces/{id}/valider` | `COMPTABLE` |
| **Tiers** | GET, POST, PUT, DELETE | `/api/fournisseurs/**`, `/api/clients/**` | `COMPTABLE` |
| **Exercices** | GET, POST, PUT, DELETE | `/api/exercices/**` | `COMPTABLE` |
| **Exercices** | PATCH | `/api/exercices/{id}/cloturer` | `COMPTABLE` |
| **Factures** | GET, POST, PUT, PATCH, DELETE | `/api/factures/**` | `COMPTABLE` |
| **Paiements** | GET | `/api/paiements` | `COMPTABLE`, `DIRECTEUR_FINANCIER` |
| **Paiements** | POST | `/api/paiements` | `COMPTABLE` |
| **Paiements** | PUT | `/api/paiements/{id}/valider` | `DIRECTEUR_FINANCIER` |
| **Plan comptable** | GET | `/api/comptes/**` | Tout utilisateur authentifié (listes déroulantes de la saisie) |
| **Plan comptable** | POST, PUT, DELETE | `/api/comptes/**` | `ADMIN` |
| **Centres de coûts** | GET | `/api/centres-cout/**` | Tout utilisateur authentifié (listes déroulantes) |
| **Centres de coûts** | POST, PUT, DELETE | `/api/centres-cout/**` | `CONTROLEUR` |
| **Budgets CO** | GET, POST, PUT, DELETE | `/api/budgets/**` | `CONTROLEUR` |
| **Répartition analytique** | GET, POST | `/api/imputations` | `CONTROLEUR` |
| **Rapport analytique** | GET | `/api/rapports/analytique?annee={annee}` | `CONTROLEUR` |

### Format des erreurs

```json
{ "message": "L'ICE doit comporter exactement 15 chiffres.",
  "champs": { "ice": "L'ICE doit comporter exactement 15 chiffres." } }
```
`message` est affiché tel quel par React ; `champs` (facultatif) indique le champ fautif, que le formulaire encadre en rouge.
Pour une écriture, les champs de ligne sont nommés `lignes.N.compteId`, `lignes.N.centreCoutId`, `lignes.N.montant` (N = numéro de ligne, à partir de 1).

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
  - `400 Bad Request` : nom manquant ; ICE différent de 15 chiffres ; email mal formé ; téléphone non marocain (05/06/07/08 + 8 chiffres, ou +212) ; RIB différent de 24 chiffres. Les espaces, points et tirets sont ignorés.
  - `409 Conflict` : un autre fournisseur possède déjà cet ICE.
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
  - `400 Bad Request` : nom manquant ; ICE, email ou téléphone invalide ; plafond de crédit négatif ou avec plus de 2 décimales.
  - `409 Conflict` : un autre client possède déjà cet ICE.
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
  "principal": true,
  "cleRepartition": 100.00
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

### 4.5. Factures (`/api/factures`) — rôle `COMPTABLE`
- `GET /api/factures` : liste les factures avec montants HT/TTC, tiers, statut et pièce générée.
- `POST /api/factures` : `{ "numero": "FAC-2026-001", "dateFacture": "2026-10-10", "type": "ACHAT", "montantHT": 1000, "tauxTVA": 20, "tiersId": 1 }` → `201 Created`, facture en brouillon. Une facture `ACHAT` exige un fournisseur ; `VENTE` exige un client.
- `PUT /api/factures/{id}` et `DELETE /api/factures/{id}` : réservés aux brouillons.
- `PATCH /api/factures/{id}/valider` : comptabilise et valide une pièce équilibrée en partie double. Pour un achat, le corps doit contenir `{ "centreCoutId": 2 }`. Les comptes standards sont 6111/34552/4411 pour un achat et 3421/7111/4455 pour une vente.
- La date doit appartenir à un exercice ouvert. Le numéro est unique pour un tiers. Une facture validée ne peut plus être modifiée ou supprimée.

### 4.6. Paiements (`/api/paiements`)
- `GET /api/paiements` : accessible au `COMPTABLE` et au `DIRECTEUR_FINANCIER`.
- `POST /api/paiements` : réservé au `COMPTABLE`. Exemple : `{ "datePaiement": "2026-10-15", "mode": "VIREMENT", "allocations": [{ "factureId": 1, "montantAffecte": 500 }] }`. Le total du paiement est calculé à partir des affectations ; seules les factures validées sont éligibles et un paiement partiel est accepté.
- `PUT /api/paiements/{id}/valider` : réservé au `DIRECTEUR_FINANCIER`. Une facture passe à `PAYEE` lorsque la somme de ses paiements validés atteint son TTC ; sinon elle reste `VALIDEE`.
- Les paiements en attente réservent aussi les montants affectés afin d'empêcher les dépassements de facture.

### 4.7. Répartition et rapports analytiques — rôle `CONTROLEUR`
- `GET /api/imputations?periode=AAAA-MM` : historique de la période.
- `POST /api/imputations` : `{ "periode": "2026-10" }`. Répartit les charges nettes de classe 6 des écritures validées des centres auxiliaires vers les centres principaux, au prorata de leur `cleRepartition`. Une période/source ne peut être calculée qu'une fois.
- `GET /api/rapports/analytique?annee=2026` : retourne les charges nettes (classe 6), produits nets (classe 7), l'évolution mensuelle et les écarts réel-budget par centre à partir des seules écritures validées. Les imputations déjà calculées réduisent le réel des centres sources et augmentent celui des centres cibles.

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

---

## 6. Endpoints ajoutés : écritures, exercices, budgets

### 6.1. Écritures (`/api/pieces`) — rôle `COMPTABLE`
- `POST /api/pieces` : `{ "dateEcriture": "2026-10-13", "libelle": "Loyer octobre", "lignes": [ { "compteId": 8, "centreCoutId": 2, "sens": "DEBIT", "montant": 9000 }, { "compteId": 5, "sens": "CREDIT", "montant": 9000 } ] }` → `201 Created` (pièce en **brouillon**, numéro `PC-AAAA-NNNNN` attribué par le serveur).
- Erreurs `400` : libellé vide ou > 255 caractères ; date absente, **future**, hors exercice ou dans un exercice **clôturé** ; moins de 2 lignes ou pas de débit **et** de crédit ; compte manquant ; montant ≤ 0, > 2 décimales ou > 13 chiffres ; compte de **classe 6 sans centre de coûts** ; centre de coûts sur un compte de **bilan (classes 1 à 5)** ; total débit ≠ total crédit.
- `PATCH /api/pieces/{id}/valider` → `200 OK`. Erreurs `400` : pièce déjà validée, exercice clôturé ; `404` : pièce introuvable.

### 6.2. Exercices (`/api/exercices`) — rôle `COMPTABLE`
- `POST` / `PUT` : `{ "annee": 2027, "dateDebut": "2027-01-01", "dateFin": "2027-12-31" }`.
- Erreurs `400` : année hors 2000–2099 ou différente de l'année de début/fin ; début ≥ fin ; durée > 12 mois ; exercice clôturé (modification) ; pièces qui sortiraient de la nouvelle période. Erreurs `409` : année déjà utilisée ; période qui **chevauche** un autre exercice ; suppression d'un exercice contenant des pièces.
- `PATCH /api/exercices/{id}/cloturer` → `200 OK`. Erreurs `400` : déjà clôturé ; un exercice **antérieur** n'est pas clôturé ; des pièces sont encore en **brouillon**.
- `DELETE` : `400` si l'exercice est clôturé, `409` s'il contient des pièces.

### 6.3. Budgets CO (`/api/budgets`) — rôle `CONTROLEUR`
- `POST` / `PUT` : `{ "centreCoutId": 3, "annee": 2026, "montantPrevu": 900000 }`.
- Erreurs `400` : centre manquant ou introuvable ; année hors 2000–2099 ; montant négatif, > 2 décimales ou > 13 chiffres ; exercice de l'année **clôturé** (budget figé, aussi pour la suppression). Erreur `409` : un budget existe déjà pour ce centre et cette année.
