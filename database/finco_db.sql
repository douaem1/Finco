-- =====================================================================
--  FinCo — Base de données MySQL 8
--  Application de comptabilité financière (FI) et contrôle de gestion (CO)
--  Exécution : mysql -u root -p < finco_db.sql
-- =====================================================================

DROP DATABASE IF EXISTS finco_db;
CREATE DATABASE finco_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE finco_db;

-- ---------------------------------------------------------------------
-- 1. Utilisateurs (authentification Spring Security)
-- ---------------------------------------------------------------------
CREATE TABLE utilisateur (
                             id            BIGINT AUTO_INCREMENT PRIMARY KEY,
                             login         VARCHAR(50)  NOT NULL UNIQUE,
                             mot_de_passe  VARCHAR(100) NOT NULL,              -- hachage BCrypt
                             nom_complet   VARCHAR(100) NOT NULL,
                             email         VARCHAR(100),
                             role          ENUM('COMPTABLE','CONTROLEUR','DIRECTEUR_FINANCIER','ADMIN') NOT NULL,
                             actif         BOOLEAN      NOT NULL DEFAULT TRUE,
                             date_creation DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. Données de base : société, exercice, plan comptable
-- ---------------------------------------------------------------------
CREATE TABLE societe (
                         id              BIGINT AUTO_INCREMENT PRIMARY KEY,
                         raison_sociale  VARCHAR(150) NOT NULL,
                         ice             CHAR(15)     NOT NULL UNIQUE,     -- identifiant commun de l'entreprise
                         adresse         VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE exercice (
                          id          BIGINT AUTO_INCREMENT PRIMARY KEY,
                          annee       INT     NOT NULL,
                          date_debut  DATE    NOT NULL,
                          date_fin    DATE    NOT NULL,
                          cloture     BOOLEAN NOT NULL DEFAULT FALSE,
                          societe_id  BIGINT  NOT NULL,
                          CONSTRAINT fk_exercice_societe FOREIGN KEY (societe_id) REFERENCES societe(id),
                          CONSTRAINT uk_exercice UNIQUE (societe_id, annee),
                          CONSTRAINT ck_exercice_dates CHECK (date_fin > date_debut)
) ENGINE=InnoDB;

CREATE TABLE compte_general (
                                id       BIGINT AUTO_INCREMENT PRIMARY KEY,
                                numero   VARCHAR(10)  NOT NULL UNIQUE,            -- ex. 6136
                                libelle  VARCHAR(150) NOT NULL,
                                classe   TINYINT      NOT NULL,                   -- classes 1 à 8 du CGNC
                                CONSTRAINT ck_compte_classe CHECK (classe BETWEEN 1 AND 8)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. Contrôle de gestion : centres de coûts et budgets
-- ---------------------------------------------------------------------
CREATE TABLE centre_cout (
                             id               BIGINT AUTO_INCREMENT PRIMARY KEY,
                             code             VARCHAR(10)   NOT NULL UNIQUE,
                             libelle          VARCHAR(100)  NOT NULL,
                             principal        BOOLEAN       NOT NULL DEFAULT TRUE,   -- FALSE = centre auxiliaire
                             cle_repartition  DECIMAL(10,2) NOT NULL DEFAULT 0,      -- ex. surface en m²
                             responsable      VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE budget (
                        id              BIGINT AUTO_INCREMENT PRIMARY KEY,
                        annee           INT           NOT NULL,
                        montant_prevu   DECIMAL(15,2) NOT NULL,
                        centre_cout_id  BIGINT        NOT NULL,
                        CONSTRAINT fk_budget_centre FOREIGN KEY (centre_cout_id) REFERENCES centre_cout(id),
                        CONSTRAINT uk_budget UNIQUE (centre_cout_id, annee),
                        CONSTRAINT ck_budget_montant CHECK (montant_prevu >= 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. Comptabilité générale : pièces et lignes d'écriture
-- ---------------------------------------------------------------------
CREATE TABLE piece_comptable (
                                 id              BIGINT AUTO_INCREMENT PRIMARY KEY,
                                 numero          VARCHAR(20)  NOT NULL UNIQUE,     -- ex. PC-2026-00001
                                 date_ecriture   DATE         NOT NULL,
                                 libelle         VARCHAR(255) NOT NULL,
                                 validee         BOOLEAN      NOT NULL DEFAULT FALSE,
                                 exercice_id     BIGINT       NOT NULL,
                                 utilisateur_id  BIGINT       NOT NULL,            -- utilisateur qui a saisi la pièce
                                 date_creation   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 CONSTRAINT fk_piece_exercice    FOREIGN KEY (exercice_id)    REFERENCES exercice(id),
                                 CONSTRAINT fk_piece_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
) ENGINE=InnoDB;

CREATE TABLE ligne_ecriture (
                                id              BIGINT AUTO_INCREMENT PRIMARY KEY,
                                piece_id        BIGINT        NOT NULL,
                                compte_id       BIGINT        NOT NULL,
                                centre_cout_id  BIGINT        NULL,               -- obligatoire pour les charges (classe 6), contrôlé par le service
                                sens            ENUM('DEBIT','CREDIT') NOT NULL,
                                montant         DECIMAL(15,2) NOT NULL,
                                CONSTRAINT fk_ligne_piece  FOREIGN KEY (piece_id)       REFERENCES piece_comptable(id) ON DELETE CASCADE,
                                CONSTRAINT fk_ligne_compte FOREIGN KEY (compte_id)      REFERENCES compte_general(id),
                                CONSTRAINT fk_ligne_centre FOREIGN KEY (centre_cout_id) REFERENCES centre_cout(id),
                                CONSTRAINT ck_ligne_montant CHECK (montant > 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. Tiers, factures et paiements
--    Tiers : héritage JPA SINGLE_TABLE (colonne discriminante type_tiers)
-- ---------------------------------------------------------------------
CREATE TABLE tiers (
                       id              BIGINT AUTO_INCREMENT PRIMARY KEY,
                       type_tiers      ENUM('FOURNISSEUR','CLIENT') NOT NULL,
                       nom             VARCHAR(150) NOT NULL,
                       ice             CHAR(15),
                       email           VARCHAR(100),
                       telephone       VARCHAR(20),
                       rib             CHAR(24)      NULL,               -- fournisseur uniquement
                       plafond_credit  DECIMAL(15,2) NULL                -- client uniquement
) ENGINE=InnoDB;

CREATE TABLE facture (
                         id            BIGINT AUTO_INCREMENT PRIMARY KEY,
                         numero        VARCHAR(30)   NOT NULL,
                         date_facture  DATE          NOT NULL,
                         type          ENUM('ACHAT','VENTE') NOT NULL,
                         montant_ht    DECIMAL(15,2) NOT NULL,
                         taux_tva      DECIMAL(5,2)  NOT NULL DEFAULT 20.00,
                         statut        ENUM('BROUILLON','VALIDEE','PAYEE') NOT NULL DEFAULT 'BROUILLON',
                         tiers_id      BIGINT        NOT NULL,
                         piece_id      BIGINT        NULL UNIQUE,          -- pièce comptable générée (0..1)
                         CONSTRAINT fk_facture_tiers FOREIGN KEY (tiers_id) REFERENCES tiers(id),
                         CONSTRAINT fk_facture_piece FOREIGN KEY (piece_id) REFERENCES piece_comptable(id),
                         CONSTRAINT uk_facture UNIQUE (tiers_id, numero),  -- évite les doublons
                         CONSTRAINT ck_facture_ht CHECK (montant_ht >= 0)
) ENGINE=InnoDB;

CREATE TABLE paiement (
                          id             BIGINT AUTO_INCREMENT PRIMARY KEY,
                          date_paiement  DATE          NOT NULL,
                          montant        DECIMAL(15,2) NOT NULL,
                          mode           ENUM('VIREMENT','CHEQUE','ESPECES','EFFET') NOT NULL,
                          valide_par     BIGINT        NULL,                -- directeur financier
                          CONSTRAINT fk_paiement_valideur FOREIGN KEY (valide_par) REFERENCES utilisateur(id),
                          CONSTRAINT ck_paiement_montant CHECK (montant > 0)
) ENGINE=InnoDB;

-- Association Paiement (0..*) — (1..*) Facture
CREATE TABLE paiement_facture (
                                  paiement_id      BIGINT        NOT NULL,
                                  facture_id       BIGINT        NOT NULL,
                                  montant_affecte  DECIMAL(15,2) NOT NULL,
                                  PRIMARY KEY (paiement_id, facture_id),
                                  CONSTRAINT fk_pf_paiement FOREIGN KEY (paiement_id) REFERENCES paiement(id) ON DELETE CASCADE,
                                  CONSTRAINT fk_pf_facture  FOREIGN KEY (facture_id)  REFERENCES facture(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. Répartition des coûts (résultat de la séquence 3)
-- ---------------------------------------------------------------------
CREATE TABLE imputation (
                            id               BIGINT AUTO_INCREMENT PRIMARY KEY,
                            periode          CHAR(7)       NOT NULL,          -- format AAAA-MM
                            centre_source_id BIGINT        NOT NULL,          -- centre auxiliaire
                            centre_cible_id  BIGINT        NOT NULL,          -- centre principal
                            montant          DECIMAL(15,2) NOT NULL,
                            date_calcul      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            CONSTRAINT fk_imp_source FOREIGN KEY (centre_source_id) REFERENCES centre_cout(id),
                            CONSTRAINT fk_imp_cible  FOREIGN KEY (centre_cible_id)  REFERENCES centre_cout(id)
) ENGINE=InnoDB;

-- Index utiles pour les consultations
CREATE INDEX idx_piece_date   ON piece_comptable(date_ecriture);
CREATE INDEX idx_ligne_compte ON ligne_ecriture(compte_id);
CREATE INDEX idx_facture_stat ON facture(statut);

-- ---------------------------------------------------------------------
-- 7. Vues de reporting
-- ---------------------------------------------------------------------
-- Balance des comptes (pièces validées uniquement)
CREATE VIEW v_balance AS
SELECT c.numero, c.libelle,
       COALESCE(SUM(CASE WHEN l.sens = 'DEBIT'  THEN l.montant END), 0) AS total_debit,
       COALESCE(SUM(CASE WHEN l.sens = 'CREDIT' THEN l.montant END), 0) AS total_credit,
       COALESCE(SUM(CASE WHEN l.sens = 'DEBIT'  THEN l.montant ELSE -l.montant END), 0) AS solde
FROM compte_general c
         LEFT JOIN ligne_ecriture  l ON l.compte_id = c.id
         LEFT JOIN piece_comptable p ON p.id = l.piece_id
WHERE p.id IS NULL OR p.validee = TRUE
GROUP BY c.id, c.numero, c.libelle;

-- Réel / budget par centre de coûts (charges directes des pièces validées)
CREATE VIEW v_reel_budget AS
SELECT cc.code, cc.libelle, b.annee, b.montant_prevu,
       COALESCE(r.reel, 0)                   AS montant_reel,
       COALESCE(r.reel, 0) - b.montant_prevu AS ecart
FROM centre_cout cc
         JOIN budget b ON b.centre_cout_id = cc.id
         LEFT JOIN (
    SELECT l.centre_cout_id, YEAR(p.date_ecriture) AS annee,
        SUM(CASE WHEN l.sens = 'DEBIT' THEN l.montant ELSE -l.montant END) AS reel
    FROM ligne_ecriture l
        JOIN piece_comptable p ON p.id = l.piece_id
    WHERE p.validee = TRUE AND l.centre_cout_id IS NOT NULL
    GROUP BY l.centre_cout_id, YEAR(p.date_ecriture)
) r ON r.centre_cout_id = cc.id AND r.annee = b.annee;

-- =====================================================================
--  Données de test
-- =====================================================================
-- Mot de passe de tous les utilisateurs de test : admin123 (hachage BCrypt)
INSERT INTO utilisateur (login, mot_de_passe, nom_complet, email, role) VALUES
                                                                            ('admin',      '$2a$10$amqIwfkFD9tJomnZBTgyuOeSZFtpI7i849ZEeo6pJ7t1NCVaOcamW', 'Administrateur',        'admin@finco.ma',      'ADMIN'),
                                                                            ('comptable',  '$2a$10$amqIwfkFD9tJomnZBTgyuOeSZFtpI7i849ZEeo6pJ7t1NCVaOcamW', 'Sara Comptable',        'compta@finco.ma',     'COMPTABLE'),
                                                                            ('controleur', '$2a$10$amqIwfkFD9tJomnZBTgyuOeSZFtpI7i849ZEeo6pJ7t1NCVaOcamW', 'Youssef Contrôleur',    'cg@finco.ma',         'CONTROLEUR'),
                                                                            ('daf',        '$2a$10$amqIwfkFD9tJomnZBTgyuOeSZFtpI7i849ZEeo6pJ7t1NCVaOcamW', 'Nadia Directrice fin.', 'daf@finco.ma',        'DIRECTEUR_FINANCIER');

INSERT INTO societe (raison_sociale, ice, adresse) VALUES
    ('FinCo Démo SARL', '001234567000089', 'Bd Zerktouni, Casablanca');

INSERT INTO exercice (annee, date_debut, date_fin, societe_id) VALUES
    (2026, '2026-01-01', '2026-12-31', 1);

INSERT INTO compte_general (numero, libelle, classe) VALUES
                                                         ('3421',  'Clients',                                 3),
                                                         ('34552', 'État - TVA récupérable sur les charges',  3),
                                                         ('4411',  'Fournisseurs',                            4),
                                                         ('4455',  'État - TVA facturée',                     4),
                                                         ('5141',  'Banques',                                 5),
                                                         ('6111',  'Achats de marchandises',                  6),
                                                         ('6131',  'Locations et charges locatives',          6),
                                                         ('6136',  'Rémunérations d''intermédiaires et honoraires', 6),
                                                         ('7111',  'Ventes de marchandises',                  7);

INSERT INTO centre_cout (code, libelle, principal, cle_repartition, responsable) VALUES
                                                                                     ('ADM',  'Administration',       FALSE,   0, 'Nadia'),
                                                                                     ('BAT',  'Bâtiments (loyer)',    FALSE,   0, 'Nadia'),
                                                                                     ('PROD', 'Production',           TRUE,  600, 'Karim'),
                                                                                     ('COM',  'Commercial',           TRUE,  250, 'Leila'),
                                                                                     ('DIR',  'Direction',            TRUE,  150, 'Nadia');

INSERT INTO budget (annee, montant_prevu, centre_cout_id) VALUES
                                                              (2026, 120000.00, 1), (2026, 360000.00, 2), (2026, 900000.00, 3),
                                                              (2026, 300000.00, 4), (2026, 200000.00, 5);

INSERT INTO tiers (type_tiers, nom, ice, email, rib, plafond_credit) VALUES
                                                                         ('FOURNISSEUR', 'Cabinet Audit Conseil', '002345678000011', 'contact@audit.ma', '011780000012345678901234', NULL),
                                                                         ('FOURNISSEUR', 'Immo Location SA',      '003456789000022', 'info@immo.ma',     '007780000098765432109876', NULL),
                                                                         ('CLIENT',      'Client Atlas SARL',     '004567890000033', 'achat@atlas.ma',   NULL, 500000.00);

-- Pièce 1 : facture d'honoraires 30 000 HT + TVA 20 % (validée)
INSERT INTO piece_comptable (numero, date_ecriture, libelle, validee, exercice_id, utilisateur_id) VALUES
    ('PC-2026-00001', '2026-09-10', 'Facture Cabinet Audit Conseil F-0917', TRUE, 1, 2);
INSERT INTO ligne_ecriture (piece_id, compte_id, centre_cout_id, sens, montant) VALUES
                                                                                    (1, (SELECT id FROM compte_general WHERE numero = '6136'),  1,    'DEBIT',  30000.00),
                                                                                    (1, (SELECT id FROM compte_general WHERE numero = '34552'), NULL, 'DEBIT',   6000.00),
                                                                                    (1, (SELECT id FROM compte_general WHERE numero = '4411'),  NULL, 'CREDIT', 36000.00);

INSERT INTO facture (numero, date_facture, type, montant_ht, taux_tva, statut, tiers_id, piece_id) VALUES
    ('F-0917', '2026-09-10', 'ACHAT', 30000.00, 20.00, 'VALIDEE', 1, 1);

-- Pièce 2 : loyer de septembre 90 000 (sur le centre auxiliaire Bâtiments)
INSERT INTO piece_comptable (numero, date_ecriture, libelle, validee, exercice_id, utilisateur_id) VALUES
    ('PC-2026-00002', '2026-09-30', 'Loyer septembre', TRUE, 1, 2);
INSERT INTO ligne_ecriture (piece_id, compte_id, centre_cout_id, sens, montant) VALUES
                                                                                    (2, (SELECT id FROM compte_general WHERE numero = '6131'), 2,    'DEBIT',  90000.00),
                                                                                    (2, (SELECT id FROM compte_general WHERE numero = '5141'), NULL, 'CREDIT', 90000.00);

-- Paiement de la facture F-0917 validé par le directeur financier
INSERT INTO paiement (date_paiement, montant, mode, valide_par) VALUES
    ('2026-09-25', 36000.00, 'VIREMENT', 4);
INSERT INTO paiement_facture (paiement_id, facture_id, montant_affecte) VALUES (1, 1, 36000.00);
UPDATE facture SET statut = 'PAYEE' WHERE id = 1;

-- Pièce 3 : écriture du paiement (fournisseur / banque)
INSERT INTO piece_comptable (numero, date_ecriture, libelle, validee, exercice_id, utilisateur_id) VALUES
    ('PC-2026-00003', '2026-09-25', 'Paiement facture F-0917', TRUE, 1, 2);
INSERT INTO ligne_ecriture (piece_id, compte_id, centre_cout_id, sens, montant) VALUES
                                                                                    (3, (SELECT id FROM compte_general WHERE numero = '4411'), NULL, 'DEBIT',  36000.00),
                                                                                    (3, (SELECT id FROM compte_general WHERE numero = '5141'), NULL, 'CREDIT', 36000.00);

-- Répartition du loyer (90 000) selon les surfaces : 600 / 250 / 150 m²
INSERT INTO imputation (periode, centre_source_id, centre_cible_id, montant) VALUES
                                                                                 ('2026-09', 2, 3, 54000.00),
                                                                                 ('2026-09', 2, 4, 22500.00),
                                                                                 ('2026-09', 2, 5, 13500.00);

-- Vérification rapide
-- SELECT * FROM v_balance;
-- SELECT * FROM v_reel_budget;