import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listerCentres, creerCentre, modifierCentre, supprimerCentre } from '../services/centreCoutApi';
import { erreursParChamp, messageErreur } from '../services/api';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';
import Icone from '../components/Icone';

export default function CentresCout() {
  const { utilisateur } = useAuth();
  const [centres, setCentres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [recherche, setRecherche] = useState('');

  // Modale édition / création
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [centreEnCours, setCentreEnCours] = useState(null); // null = création
  const [formulaire, setFormulaire] = useState({ code: '', libelle: '', principal: true });
  const [erreursChamps, setErreursChamps] = useState({});
  const [erreurModale, setErreurModale] = useState('');
  const [chargementAction, setChargementAction] = useState(false);

  // Modale suppression
  const [centreASupprimer, setCentreASupprimer] = useState(null);

  const estControleur = utilisateur?.role === 'CONTROLEUR';

  useEffect(() => {
    chargerCentres();
  }, []);

  async function chargerCentres() {
    setChargement(true);
    setErreur('');
    try {
      const data = await listerCentres();
      setCentres(data);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }

  function ouvrirCreation() {
    setCentreEnCours(null);
    setFormulaire({ code: '', libelle: '', principal: true });
    setErreursChamps({});
    setErreurModale('');
    setModaleOuverte(true);
  }

  function ouvrirModification(c) {
    setCentreEnCours(c);
    setFormulaire({ code: c.code, libelle: c.libelle, principal: c.principal });
    setErreursChamps({});
    setErreurModale('');
    setModaleOuverte(true);
  }

  function validerFormulaire() {
    const errs = {};
    const code = formulaire.code.trim().toUpperCase();
    if (!code) {
      errs.code = 'Le code du centre est obligatoire.';
    } else if (code.length < 2 || code.length > 10) {
      errs.code = 'Le code doit comporter entre 2 et 10 caractères.';
    } else if (!/^[A-Z0-9_]{2,10}$/.test(code)) {
      errs.code = 'Le code ne doit contenir que des majuscules, chiffres et le caractère « _ ».';
    }

    const lib = formulaire.libelle.trim();
    if (!lib) {
      errs.libelle = 'Le libellé du centre est obligatoire.';
    } else if (lib.length > 100) {
      errs.libelle = 'Le libellé ne doit pas dépasser 100 caractères.';
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
      code: formulaire.code.trim().toUpperCase(),
      libelle: formulaire.libelle.trim(),
      principal: Boolean(formulaire.principal),
    };

    try {
      if (centreEnCours) {
        const modifie = await modifierCentre(centreEnCours.id, payload);
        setCentres((prev) => prev.map((c) => (c.id === modifie.id ? modifie : c)));
        setSucces(`Centre de coûts « ${modifie.code} - ${modifie.libelle} » mis à jour avec succès.`);
      } else {
        const cree = await creerCentre(payload);
        setCentres((prev) => [...prev, cree].sort((a, b) => a.code.localeCompare(b.code)));
        setSucces(`Centre de coûts « ${cree.code} - ${cree.libelle} » créé avec succès.`);
      }
      setModaleOuverte(false);
    } catch (err) {
      setErreursChamps((prev) => ({ ...prev, ...erreursParChamp(err) }));
      setErreurModale(messageErreur(err));
    } finally {
      setChargementAction(false);
    }
  }

  async function confirmerSuppression() {
    if (!centreASupprimer) return;
    setChargementAction(true);
    setErreur('');
    setSucces('');

    try {
      await supprimerCentre(centreASupprimer.id);
      setCentres((prev) => prev.filter((c) => c.id !== centreASupprimer.id));
      setSucces(`Centre de coûts « ${centreASupprimer.code} - ${centreASupprimer.libelle} » supprimé avec succès.`);
      setCentreASupprimer(null);
    } catch (err) {
      setErreur(messageErreur(err));
      setCentreASupprimer(null);
    } finally {
      setChargementAction(false);
    }
  }

  const filtre = recherche.trim().toLowerCase();
  const centresVisibles = useMemo(() => {
    return centres.filter((c) => {
      if (!filtre) return true;
      return (
        c.code.toLowerCase().includes(filtre) ||
        c.libelle.toLowerCase().includes(filtre)
      );
    });
  }, [centres, filtre]);

  return (
    <section>
      <header className="entete-page">
        <div>
          <h1>Centres de coûts</h1>
          <p className="texte-secondaire">Contrôle de gestion : unités organisationnelles pour l'imputation analytique.</p>
        </div>
        {estControleur && (
          <button type="button" className="btn btn-primaire" onClick={ouvrirCreation}>
            <Icone nom="plus" taille={18} /> Nouveau centre de coûts
          </button>
        )}
      </header>

      {succes && <p className="message-succes" role="status">{succes}</p>}
      <MessageErreur message={erreur} />

      {chargement ? (
        <Chargement />
      ) : centres.length === 0 ? (
        <div className="panneau vide">
          <Icone nom="centres" taille={36} />
          <p><strong>Aucun centre de coûts configuré.</strong></p>
          <p className="texte-secondaire">Définissez vos centres principaux et auxiliaires pour affecter les charges.</p>
          {estControleur && (
            <button type="button" className="btn btn-primaire" onClick={ouvrirCreation}>
              Créer le premier centre
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
                placeholder="Rechercher par code ou libellé..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                aria-label="Rechercher un centre"
              />
            </label>
            <span className="texte-secondaire">
              {centresVisibles.length} centre{centresVisibles.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="defilement">
            <table className="tableau">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Code</th>
                  <th>Libellé</th>
                  <th style={{ width: '140px' }}>Type</th>
                  {estControleur && <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {centresVisibles.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="code-centre">{c.code}</span>
                    </td>
                    <td>{c.libelle}</td>
                    <td>
                      <span className={`badge ${c.principal ? 'badge-principal' : 'badge-auxiliaire'}`}>
                        {c.principal ? 'Principal' : 'Auxiliaire'}
                      </span>
                    </td>
                    {estControleur && (
                      <td style={{ textAlign: 'center' }}>
                        <div className="actions-cell">
                          <button
                            type="button"
                            className="btn-action"
                            onClick={() => ouvrirModification(c)}
                            title="Modifier ce centre"
                          >
                            <Icone nom="editer" taille={16} />
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-action-supprimer"
                            onClick={() => setCentreASupprimer(c)}
                            title="Supprimer ce centre"
                          >
                            <Icone nom="supprimer" taille={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {centresVisibles.length === 0 && (
                  <tr>
                    <td colSpan={estControleur ? 4 : 3} className="texte-secondaire aucun-resultat">
                      Aucun centre de coûts ne correspond à « {recherche} ».
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
              <h2>{centreEnCours ? 'Modifier le centre de coûts' : 'Nouveau centre de coûts'}</h2>
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
                <MessageErreur message={erreurModale} onFermer={() => setErreurModale('')} />
                <div className="champ">
                  <label className="champ-label" htmlFor="centre-code">
                    Code du centre <span style={{ color: 'var(--corail)' }}>*</span>
                  </label>
                  <input
                    id="centre-code"
                    type="text"
                    className={`input ${erreursChamps.code ? 'input-erreur' : ''}`}
                    value={formulaire.code}
                    onChange={(e) => setFormulaire({ ...formulaire, code: e.target.value.toUpperCase() })}
                    placeholder="Ex. PROD, ADM, COM..."
                    maxLength={10}
                    required
                  />
                  {erreursChamps.code && <span className="champ-erreur">{erreursChamps.code}</span>}
                  <span className="champ-aide">
                    De 2 à 10 caractères : lettres majuscules, chiffres et tiret du bas uniquement.
                  </span>
                </div>

                <div className="champ">
                  <label className="champ-label" htmlFor="centre-libelle">
                    Libellé du centre <span style={{ color: 'var(--corail)' }}>*</span>
                  </label>
                  <input
                    id="centre-libelle"
                    type="text"
                    className={`input ${erreursChamps.libelle ? 'input-erreur' : ''}`}
                    value={formulaire.libelle}
                    onChange={(e) => setFormulaire({ ...formulaire, libelle: e.target.value })}
                    placeholder="Ex. Atelier de production, Administration..."
                    maxLength={100}
                    required
                  />
                  {erreursChamps.libelle && <span className="champ-erreur">{erreursChamps.libelle}</span>}
                </div>

                <div className="champ">
                  <span className="champ-label">Type de centre</span>
                  <div className="bascule" style={{ marginTop: '4px' }}>
                    <button
                      type="button"
                      className={formulaire.principal ? 'actif' : ''}
                      onClick={() => setFormulaire({ ...formulaire, principal: true })}
                    >
                      Principal
                    </button>
                    <button
                      type="button"
                      className={!formulaire.principal ? 'actif' : ''}
                      onClick={() => setFormulaire({ ...formulaire, principal: false })}
                    >
                      Auxiliaire
                    </button>
                  </div>
                  <span className="champ-aide">
                    {formulaire.principal
                      ? 'Centre principal : accueille directement les charges de production et commerciales.'
                      : 'Centre auxiliaire : assure des prestations internes redistribuées aux centres principaux.'}
                  </span>
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
                  {chargementAction ? 'Enregistrement...' : centreEnCours ? 'Mettre à jour' : 'Créer le centre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE SUPPRESSION */}
      {centreASupprimer && (
        <div className="modale-fond" onClick={() => setCentreASupprimer(null)}>
          <div className="modale-boite" onClick={(e) => e.stopPropagation()}>
            <div className="modale-entete">
              <h2>Confirmer la suppression</h2>
              <button
                type="button"
                className="bouton-icone"
                onClick={() => setCentreASupprimer(null)}
              >
                <Icone nom="croix" taille={18} />
              </button>
            </div>
            <div className="modale-corps">
              <p>
                Êtes-vous sûr de vouloir supprimer le centre de coûts <strong>« {centreASupprimer.code} - {centreASupprimer.libelle} »</strong> ?
              </p>
              <p className="texte-secondaire" style={{ fontSize: '0.86rem' }}>
                Cette action est irréversible. La suppression sera automatiquement refusée par le serveur si ce centre
                est déjà rattaché à une écriture comptable ou s'il dispose d'un budget prévisionnel.
              </p>
            </div>
            <div className="modale-pied">
              <button
                type="button"
                className="btn btn-secondaire"
                onClick={() => setCentreASupprimer(null)}
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
