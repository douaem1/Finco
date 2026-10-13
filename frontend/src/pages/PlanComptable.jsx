import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listerComptes, creerCompte, modifierCompte, supprimerCompte } from '../services/compteApi';
import { messageErreur } from '../services/api';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';
import Icone from '../components/Icone';

const NOMS_CLASSES = {
  1: 'Comptes de financement permanent',
  2: 'Comptes d’actif immobilisé',
  3: 'Comptes d’actif circulant (hors trésorerie)',
  4: 'Comptes de passif circulant (hors trésorerie)',
  5: 'Comptes de trésorerie',
  6: 'Comptes de charges',
  7: 'Comptes de produits',
  8: 'Comptes de résultats',
};

export default function PlanComptable() {
  const { utilisateur } = useAuth();
  const [comptes, setComptes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [recherche, setRecherche] = useState('');

  // Modale édition / création
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [compteEnCours, setCompteEnCours] = useState(null); // null = création
  const [formulaire, setFormulaire] = useState({ numero: '', libelle: '' });
  const [erreursChamps, setErreursChamps] = useState({});
  const [chargementAction, setChargementAction] = useState(false);

  // Modale suppression
  const [compteASupprimer, setCompteASupprimer] = useState(null);

  const estAdmin = utilisateur?.role === 'ADMIN';

  useEffect(() => {
    chargerComptes();
  }, []);

  async function chargerComptes() {
    setChargement(true);
    setErreur('');
    try {
      const data = await listerComptes();
      setComptes(data);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }

  function ouvrirCreation() {
    setCompteEnCours(null);
    setFormulaire({ numero: '', libelle: '' });
    setErreursChamps({});
    setModaleOuverte(true);
  }

  function ouvrirModification(c) {
    setCompteEnCours(c);
    setFormulaire({ numero: c.numero, libelle: c.libelle });
    setErreursChamps({});
    setModaleOuverte(true);
  }

  function validerFormulaire() {
    const errs = {};
    const num = formulaire.numero.trim();
    if (!num) {
      errs.numero = 'Le numéro de compte est obligatoire.';
    } else if (!/^[1-8][0-9]{1,9}$/.test(num)) {
      errs.numero = 'Le numéro doit comporter de 2 à 10 chiffres et commencer par un chiffre entre 1 et 8.';
    }

    const lib = formulaire.libelle.trim();
    if (!lib) {
      errs.libelle = 'Le libellé du compte est obligatoire.';
    } else if (lib.length > 150) {
      errs.libelle = 'Le libellé ne doit pas dépasser 150 caractères.';
    }

    setErreursChamps(errs);
    return Object.keys(errs).length === 0;
  }

  async function enregistrer(e) {
    e.preventDefault();
    if (!validerFormulaire()) return;

    setChargementAction(true);
    setErreur('');
    setSucces('');

    const payload = {
      numero: formulaire.numero.trim(),
      libelle: formulaire.libelle.trim(),
    };

    try {
      if (compteEnCours) {
        const modifie = await modifierCompte(compteEnCours.id, payload);
        setComptes((prev) => prev.map((c) => (c.id === modifie.id ? modifie : c)));
        setSucces(`Compte « ${modifie.numero} - ${modifie.libelle} » mis à jour avec succès.`);
      } else {
        const cree = await creerCompte(payload);
        setComptes((prev) => [...prev, cree].sort((a, b) => a.numero.localeCompare(b.numero)));
        setSucces(`Compte « ${cree.numero} - ${cree.libelle} » créé avec succès (Classe ${cree.classe}).`);
      }
      setModaleOuverte(false);
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setChargementAction(false);
    }
  }

  async function confirmerSuppression() {
    if (!compteASupprimer) return;
    setChargementAction(true);
    setErreur('');
    setSucces('');

    try {
      await supprimerCompte(compteASupprimer.id);
      setComptes((prev) => prev.filter((c) => c.id !== compteASupprimer.id));
      setSucces(`Compte « ${compteASupprimer.numero} - ${compteASupprimer.libelle} » supprimé avec succès.`);
      setCompteASupprimer(null);
    } catch (err) {
      setErreur(messageErreur(err));
      setCompteASupprimer(null);
    } finally {
      setChargementAction(false);
    }
  }

  const filtre = recherche.trim().toLowerCase();
  const comptesVisibles = useMemo(() => {
    return comptes.filter((c) => {
      if (!filtre) return true;
      return (
        c.numero.toLowerCase().includes(filtre) ||
        c.libelle.toLowerCase().includes(filtre)
      );
    });
  }, [comptes, filtre]);

  // Estimation de classe en temps réel pour l'aperçu utilisateur
  const premierChiffre = formulaire.numero.trim().charAt(0);
  const classeCalculee = /^[1-8]$/.test(premierChiffre) ? Number(premierChiffre) : null;

  return (
    <section>
      <header className="entete-page">
        <div>
          <h1>Plan comptable général (CGNC)</h1>
          <p className="texte-secondaire">Nomenclature officielle des comptes généraux de l’entreprise.</p>
        </div>
        {estAdmin && (
          <button type="button" className="btn btn-primaire" onClick={ouvrirCreation}>
            <Icone nom="plus" taille={18} /> Nouveau compte
          </button>
        )}
      </header>

      {succes && <p className="message-succes" role="status">{succes}</p>}
      <MessageErreur message={erreur} />

      {chargement ? (
        <Chargement />
      ) : comptes.length === 0 ? (
        <div className="panneau vide">
          <Icone nom="comptes" taille={36} />
          <p><strong>Aucun compte dans le plan comptable.</strong></p>
          <p className="texte-secondaire">Ajoutez les comptes nécessaires à la comptabilisation des opérations.</p>
          {estAdmin && (
            <button type="button" className="btn btn-primaire" onClick={ouvrirCreation}>
              Créer le premier compte
            </button>
          )}
        </div>
      ) : (
        <div className="panneau">
          <div className="barre-outils">
            <label className="recherche">
              <Icone nom="recherche" taille={18} />
              <input
                type="search"
                placeholder="Rechercher par numéro ou libellé..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                aria-label="Rechercher un compte"
              />
            </label>
            <span className="texte-secondaire">
              {comptesVisibles.length} compte{comptesVisibles.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="defilement">
            <table className="tableau">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Numéro</th>
                  <th>Libellé</th>
                  <th style={{ width: '120px' }}>Classe</th>
                  {estAdmin && <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {comptesVisibles.map((c) => (
                  <tr key={c.id}>
                    <td><strong className="numero-compte">{c.numero}</strong></td>
                    <td>{c.libelle}</td>
                    <td>
                      <span className="badge badge-classe" title={NOMS_CLASSES[c.classe] || ''}>
                        Classe {c.classe}
                      </span>
                    </td>
                    {estAdmin && (
                      <td style={{ textAlign: 'center' }}>
                        <div className="actions-cell">
                          <button
                            type="button"
                            className="btn-action"
                            onClick={() => ouvrirModification(c)}
                            title="Modifier ce compte"
                          >
                            <Icone nom="editer" taille={16} />
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-action-supprimer"
                            onClick={() => setCompteASupprimer(c)}
                            title="Supprimer ce compte"
                          >
                            <Icone nom="supprimer" taille={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {comptesVisibles.length === 0 && (
                  <tr>
                    <td colSpan={estAdmin ? 4 : 3} className="texte-secondaire aucun-resultat">
                      Aucun compte ne correspond à « {recherche} ».
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALE DE CRÉATION / MODIFICATION */}
      {modaleOuverte && (
        <div className="modale-fond" onClick={() => setModaleOuverte(false)}>
          <div className="modale-boite" onClick={(e) => e.stopPropagation()}>
            <div className="modale-entete">
              <h2>{compteEnCours ? 'Modifier le compte général' : 'Nouveau compte général'}</h2>
              <button
                type="button"
                className="bouton-icone"
                onClick={() => setModaleOuverte(false)}
                title="Fermer"
              >
                <Icone nom="croix" taille={18} />
              </button>
            </div>

            <form onSubmit={enregistrer}>
              <div className="modale-corps">
                <div className="champ">
                  <label className="champ-label" htmlFor="compte-numero">
                    Numéro de compte <span style={{ color: 'var(--corail)' }}>*</span>
                  </label>
                  <input
                    id="compte-numero"
                    type="text"
                    className={`input ${erreursChamps.numero ? 'input-erreur' : ''}`}
                    value={formulaire.numero}
                    onChange={(e) => setFormulaire({ ...formulaire, numero: e.target.value })}
                    placeholder="Ex. 6111, 4411, 3421..."
                    maxLength={10}
                    required
                  />
                  {erreursChamps.numero && <span className="champ-erreur">{erreursChamps.numero}</span>}
                  <span className="champ-aide">
                    De 2 à 10 chiffres. Le 1er chiffre (1 à 8) détermine automatiquement la classe du compte.
                  </span>
                </div>

                {classeCalculee && (
                  <div style={{ background: 'var(--creme)', padding: '10px 14px', borderRadius: 'var(--rayon)', border: '1px solid var(--ligne-forte)' }}>
                    <p style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                      Classe calculée : <span className="badge badge-classe">Classe {classeCalculee}</span>
                    </p>
                    <p className="texte-secondaire" style={{ fontSize: '0.78rem', marginTop: '2px' }}>
                      {NOMS_CLASSES[classeCalculee]}
                    </p>
                  </div>
                )}

                <div className="champ">
                  <label className="champ-label" htmlFor="compte-libelle">
                    Libellé du compte <span style={{ color: 'var(--corail)' }}>*</span>
                  </label>
                  <input
                    id="compte-libelle"
                    type="text"
                    className={`input ${erreursChamps.libelle ? 'input-erreur' : ''}`}
                    value={formulaire.libelle}
                    onChange={(e) => setFormulaire({ ...formulaire, libelle: e.target.value })}
                    placeholder="Ex. Achats de marchandises, Fournisseurs..."
                    maxLength={150}
                    required
                  />
                  {erreursChamps.libelle && <span className="champ-erreur">{erreursChamps.libelle}</span>}
                </div>
              </div>

              <div className="modale-pied">
                <button
                  type="button"
                  className="btn btn-secondaire"
                  onClick={() => setModaleOuverte(false)}
                  disabled={chargementAction}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primaire"
                  disabled={chargementAction}
                >
                  {chargementAction ? 'Enregistrement...' : compteEnCours ? 'Mettre à jour' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE SUPPRESSION */}
      {compteASupprimer && (
        <div className="modale-fond" onClick={() => setCompteASupprimer(null)}>
          <div className="modale-boite" onClick={(e) => e.stopPropagation()}>
            <div className="modale-entete">
              <h2>Confirmer la suppression</h2>
              <button
                type="button"
                className="bouton-icone"
                onClick={() => setCompteASupprimer(null)}
              >
                <Icone nom="croix" taille={18} />
              </button>
            </div>
            <div className="modale-corps">
              <p>
                Êtes-vous sûr de vouloir supprimer le compte <strong>« {compteASupprimer.numero} - {compteASupprimer.libelle} »</strong> ?
              </p>
              <p className="texte-secondaire" style={{ fontSize: '0.86rem' }}>
                Cette action est irréversible. La suppression sera automatiquement refusée par le serveur si ce compte
                est déjà utilisé dans au moins une ligne d'écriture comptable.
              </p>
            </div>
            <div className="modale-pied">
              <button
                type="button"
                className="btn btn-secondaire"
                onClick={() => setCompteASupprimer(null)}
                disabled={chargementAction}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-primaire"
                style={{ background: 'var(--corail)', borderColor: 'var(--encre)' }}
                onClick={confirmerSuppression}
                disabled={chargementAction}
              >
                {chargementAction ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
