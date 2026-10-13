import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  listerFournisseurs, creerFournisseur, modifierFournisseur, supprimerFournisseur,
  listerClients, creerClient, modifierClient, supprimerClient,
} from '../services/tiersApi';
import { erreursParChamp, messageErreur } from '../services/api';
import { montant } from '../utils/format';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';
import Icone from '../components/Icone';

export default function Tiers() {
  const { utilisateur } = useAuth();
  const [onglet, setOnglet] = useState('fournisseurs'); // 'fournisseurs' | 'clients'

  // Données
  const [fournisseurs, setFournisseurs] = useState([]);
  const [clients, setClients] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [recherche, setRecherche] = useState('');

  // Modale édition / création
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [elementEnCours, setElementEnCours] = useState(null); // null = création
  const [formulaire, setFormulaire] = useState({
    nom: '', ice: '', email: '', telephone: '', rib: '', plafondCredit: '0.00',
  });
  const [erreursChamps, setErreursChamps] = useState({});
  const [erreurModale, setErreurModale] = useState('');
  const [chargementAction, setChargementAction] = useState(false);

  // Modale suppression
  const [elementASupprimer, setElementASupprimer] = useState(null);

  const peutModifier = utilisateur?.role === 'COMPTABLE';

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    setChargement(true);
    setErreur('');
    try {
      const [f, c] = await Promise.all([listerFournisseurs(), listerClients()]);
      setFournisseurs(f);
      setClients(c);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }

  function ouvrirCreation() {
    setElementEnCours(null);
    setFormulaire({
      nom: '', ice: '', email: '', telephone: '', rib: '', plafondCredit: '0.00',
    });
    setErreursChamps({});
    setErreurModale('');
    setModaleOuverte(true);
  }

  function ouvrirModification(item) {
    setElementEnCours(item);
    setFormulaire({
      nom: item.nom || '',
      ice: item.ice || '',
      email: item.email || '',
      telephone: item.telephone || '',
      rib: item.rib || '',
      plafondCredit: item.plafondCredit !== undefined ? String(item.plafondCredit) : '0.00',
    });
    setErreursChamps({});
    setErreurModale('');
    setModaleOuverte(true);
  }

  function validerFormulaire() {
    const errs = {};
    if (!formulaire.nom || !formulaire.nom.trim()) {
      errs.nom = 'Le nom est obligatoire.';
    } else if (formulaire.nom.trim().length > 150) {
      errs.nom = 'Le nom ne doit pas dépasser 150 caractères.';
    }

    // Aide à la saisie : mêmes règles que le serveur (qui reste seul juge).
    const iceSaisi = (formulaire.ice || '').replace(/[\s.-]/g, '');
    if (iceSaisi && !/^[0-9]{15}$/.test(iceSaisi)) {
      errs.ice = "L'ICE doit comporter exactement 15 chiffres.";
    }

    const telSaisi = (formulaire.telephone || '').replace(/[\s.-]/g, '').replace(/^00212/, '+212');
    if (telSaisi && !/^(\+212|0)[5-8][0-9]{8}$/.test(telSaisi)) {
      errs.telephone = 'Numéro marocain attendu : 10 chiffres commençant par 05, 06, 07 ou 08 (ou +212).';
    }

    if (formulaire.email && formulaire.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formulaire.email.trim())) {
        errs.email = "L'adresse email n'est pas valide.";
      }
    }

    if (onglet === 'fournisseurs' && formulaire.rib && formulaire.rib.trim()) {
      if (!/^[0-9]{24}$/.test(formulaire.rib.replace(/[\s.-]/g, ''))) {
        errs.rib = 'Le RIB doit comporter exactement 24 chiffres.';
      }
    }

    if (onglet === 'clients') {
      const plafond = Number(formulaire.plafondCredit);
      if (isNaN(plafond) || plafond < 0) {
        errs.plafondCredit = 'Le plafond de crédit doit être supérieur ou égal à zéro.';
      } else if (!/^\d+([.,]\d{1,2})?$/.test(String(formulaire.plafondCredit || '0').trim())) {
        errs.plafondCredit = 'Le plafond de crédit ne peut pas avoir plus de 2 décimales.';
      }
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

    try {
      if (onglet === 'fournisseurs') {
        const payload = {
          nom: formulaire.nom.trim(),
          ice: formulaire.ice.trim() || null,
          email: formulaire.email.trim() || null,
          telephone: formulaire.telephone.trim() || null,
          rib: formulaire.rib.trim() || null,
        };

        if (elementEnCours) {
          const modifie = await modifierFournisseur(elementEnCours.id, payload);
          setFournisseurs((prev) => prev.map((f) => (f.id === modifie.id ? modifie : f)));
          setSucces(`Fournisseur « ${modifie.nom} » mis à jour avec succès.`);
        } else {
          const cree = await creerFournisseur(payload);
          setFournisseurs((prev) => [...prev, cree].sort((a, b) => a.nom.localeCompare(b.nom)));
          setSucces(`Fournisseur « ${cree.nom} » créé avec succès.`);
        }
      } else {
        const payload = {
          nom: formulaire.nom.trim(),
          ice: formulaire.ice.trim() || null,
          email: formulaire.email.trim() || null,
          telephone: formulaire.telephone.trim() || null,
          plafondCredit: formulaire.plafondCredit ? Number(formulaire.plafondCredit) : 0,
        };

        if (elementEnCours) {
          const modifie = await modifierClient(elementEnCours.id, payload);
          setClients((prev) => prev.map((c) => (c.id === modifie.id ? modifie : c)));
          setSucces(`Client « ${modifie.nom} » mis à jour avec succès.`);
        } else {
          const cree = await creerClient(payload);
          setClients((prev) => [...prev, cree].sort((a, b) => a.nom.localeCompare(b.nom)));
          setSucces(`Client « ${cree.nom} » créé avec succès.`);
        }
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
    if (!elementASupprimer) return;
    setChargementAction(true);
    setErreur('');
    setSucces('');

    try {
      if (onglet === 'fournisseurs') {
        await supprimerFournisseur(elementASupprimer.id);
        setFournisseurs((prev) => prev.filter((f) => f.id !== elementASupprimer.id));
        setSucces(`Fournisseur « ${elementASupprimer.nom} » supprimé avec succès.`);
      } else {
        await supprimerClient(elementASupprimer.id);
        setClients((prev) => prev.filter((c) => c.id !== elementASupprimer.id));
        setSucces(`Client « ${elementASupprimer.nom} » supprimé avec succès.`);
      }
      setElementASupprimer(null);
    } catch (err) {
      setErreur(messageErreur(err));
      setElementASupprimer(null);
    } finally {
      setChargementAction(false);
    }
  }

  const filtre = recherche.trim().toLowerCase();
  const listeActive = onglet === 'fournisseurs' ? fournisseurs : clients;
  const donneesVisibles = useMemo(() => {
    return listeActive.filter((item) => {
      if (!filtre) return true;
      return (
        item.nom?.toLowerCase().includes(filtre) ||
        item.ice?.toLowerCase().includes(filtre) ||
        item.email?.toLowerCase().includes(filtre)
      );
    });
  }, [listeActive, filtre]);

  return (
    <section>
      <header className="entete-page">
        <div>
          <h1>Gestion des tiers</h1>
          <p className="texte-secondaire">Référentiel des partenaires commerciaux : fournisseurs et clients.</p>
        </div>
        {peutModifier && (
          <button type="button" className="btn btn-primaire" onClick={ouvrirCreation}>
            <Icone nom="plus" taille={18} />
            {onglet === 'fournisseurs' ? 'Nouveau fournisseur' : 'Nouveau client'}
          </button>
        )}
      </header>

      {succes && <p className="message-succes" role="status">{succes}</p>}
      <MessageErreur message={erreur} />

      <div className="onglets">
        <button
          type="button"
          className={`onglet ${onglet === 'fournisseurs' ? 'actif' : ''}`}
          onClick={() => { setOnglet('fournisseurs'); setRecherche(''); }}
        >
          <Icone nom="tiers" taille={18} /> Fournisseurs ({fournisseurs.length})
        </button>
        <button
          type="button"
          className={`onglet ${onglet === 'clients' ? 'actif' : ''}`}
          onClick={() => { setOnglet('clients'); setRecherche(''); }}
        >
          <Icone nom="tiers" taille={18} /> Clients ({clients.length})
        </button>
      </div>

      {chargement ? (
        <Chargement />
      ) : listeActive.length === 0 ? (
        <div className="panneau vide">
          <Icone nom="tiers" taille={36} />
          <p><strong>Aucun {onglet === 'fournisseurs' ? 'fournisseur' : 'client'} pour l'instant.</strong></p>
          <p className="texte-secondaire">
            {onglet === 'fournisseurs'
              ? 'Ajoutez vos fournisseurs pour enregistrer leurs factures et règlements.'
              : 'Ajoutez vos clients pour émettre des factures et gérer leur encaissement.'}
          </p>
          {peutModifier && (
            <button type="button" className="btn btn-primaire" onClick={ouvrirCreation}>
              Créer le premier {onglet === 'fournisseurs' ? 'fournisseur' : 'client'}
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
                placeholder={`Rechercher un ${onglet === 'fournisseurs' ? 'fournisseur' : 'client'} par nom, ICE ou email...`}
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                aria-label="Rechercher"
              />
            </label>
            <span className="texte-secondaire">
              {donneesVisibles.length} {onglet === 'fournisseurs' ? 'fournisseur' : 'client'}{donneesVisibles.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="defilement">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>ICE</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  {onglet === 'fournisseurs' ? <th>RIB bancaire</th> : <th className="num">Plafond crédit (MAD)</th>}
                  {peutModifier && <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {donneesVisibles.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.nom}</strong></td>
                    <td className="chiffres">{item.ice || '—'}</td>
                    <td>{item.email || '—'}</td>
                    <td>{item.telephone || '—'}</td>
                    {onglet === 'fournisseurs' ? (
                      <td>{item.rib ? <span className="badge-rib">{item.rib}</span> : '—'}</td>
                    ) : (
                      <td className="num chiffres montant-fort">{montant(item.plafondCredit)}</td>
                    )}
                    {peutModifier && (
                      <td style={{ textAlign: 'center' }}>
                        <div className="actions-cell">
                          <button
                            type="button"
                            className="btn-action"
                            onClick={() => ouvrirModification(item)}
                            title="Modifier"
                          >
                            <Icone nom="editer" taille={16} />
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-action-supprimer"
                            onClick={() => setElementASupprimer(item)}
                            title="Supprimer"
                          >
                            <Icone nom="supprimer" taille={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {donneesVisibles.length === 0 && (
                  <tr>
                    <td colSpan={peutModifier ? 6 : 5} className="texte-secondaire aucun-resultat">
                      Aucun résultat correspondant à « {recherche} ».
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
              <h2>
                {elementEnCours
                  ? `Modifier le ${onglet === 'fournisseurs' ? 'fournisseur' : 'client'}`
                  : `Nouveau ${onglet === 'fournisseurs' ? 'fournisseur' : 'client'}`}
              </h2>
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
                  <label className="champ-label" htmlFor="tiers-nom">
                    Raison sociale / Nom complet <span style={{ color: 'var(--corail)' }}>*</span>
                  </label>
                  <input
                    id="tiers-nom"
                    type="text"
                    className={`input ${erreursChamps.nom ? 'input-erreur' : ''}`}
                    value={formulaire.nom}
                    onChange={(e) => setFormulaire({ ...formulaire, nom: e.target.value })}
                    placeholder="Ex. Maroc Telecom, Atlas Distribution..."
                    maxLength={150}
                    required
                  />
                  {erreursChamps.nom && <span className="champ-erreur">{erreursChamps.nom}</span>}
                </div>

                <div className="champ">
                  <label className="champ-label" htmlFor="tiers-ice">Identifiant Commun de l'Entreprise (ICE)</label>
                  <input
                    id="tiers-ice"
                    type="text"
                    className={`input ${erreursChamps.ice ? 'input-erreur' : ''}`}
                    value={formulaire.ice}
                    onChange={(e) => setFormulaire({ ...formulaire, ice: e.target.value })}
                    placeholder="15 chiffres (ex. 001524368000085)"
                    inputMode="numeric"
                    maxLength={20}
                  />
                  {erreursChamps.ice
                    ? <span className="champ-erreur">{erreursChamps.ice}</span>
                    : <span className="champ-aide">Facultatif — exactement 15 chiffres, unique par {onglet === 'fournisseurs' ? 'fournisseur' : 'client'}.</span>}
                </div>

                <div className="champ">
                  <label className="champ-label" htmlFor="tiers-email">Adresse e-mail</label>
                  <input
                    id="tiers-email"
                    type="email"
                    className={`input ${erreursChamps.email ? 'input-erreur' : ''}`}
                    value={formulaire.email}
                    onChange={(e) => setFormulaire({ ...formulaire, email: e.target.value })}
                    placeholder="contact@societe.ma"
                    maxLength={100}
                  />
                  {erreursChamps.email && <span className="champ-erreur">{erreursChamps.email}</span>}
                </div>

                <div className="champ">
                  <label className="champ-label" htmlFor="tiers-telephone">Numéro de téléphone</label>
                  <input
                    id="tiers-telephone"
                    type="tel"
                    className={`input ${erreursChamps.telephone ? 'input-erreur' : ''}`}
                    value={formulaire.telephone}
                    onChange={(e) => setFormulaire({ ...formulaire, telephone: e.target.value })}
                    placeholder="05 22 00 00 00"
                    inputMode="tel"
                    maxLength={20}
                  />
                  {erreursChamps.telephone
                    ? <span className="champ-erreur">{erreursChamps.telephone}</span>
                    : <span className="champ-aide">Facultatif — 05, 06, 07 ou 08 suivi de 8 chiffres, ou +212.</span>}
                </div>

                {onglet === 'fournisseurs' ? (
                  <div className="champ">
                    <label className="champ-label" htmlFor="tiers-rib">Relevé d'Identité Bancaire (RIB - 24 chiffres)</label>
                    <input
                      id="tiers-rib"
                      type="text"
                      className={`input ${erreursChamps.rib ? 'input-erreur' : ''}`}
                      value={formulaire.rib}
                      onChange={(e) => setFormulaire({ ...formulaire, rib: e.target.value })}
                      placeholder="Ex. 011780000012345678901234"
                      inputMode="numeric"
                      maxLength={30}
                    />
                    {erreursChamps.rib && <span className="champ-erreur">{erreursChamps.rib}</span>}
                    <span className="champ-aide">Compte bancaire marocain à 24 chiffres.</span>
                  </div>
                ) : (
                  <div className="champ">
                    <label className="champ-label" htmlFor="tiers-plafond">Plafond de crédit autorisé (MAD)</label>
                    <input
                      id="tiers-plafond"
                      type="number"
                      step="0.01"
                      min="0"
                      className={`input ${erreursChamps.plafondCredit ? 'input-erreur' : ''}`}
                      value={formulaire.plafondCredit}
                      onChange={(e) => setFormulaire({ ...formulaire, plafondCredit: e.target.value })}
                      placeholder="0.00"
                    />
                    {erreursChamps.plafondCredit && (
                      <span className="champ-erreur">{erreursChamps.plafondCredit}</span>
                    )}
                  </div>
                )}
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
                  {chargementAction ? 'Enregistrement...' : elementEnCours ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE CONFIRMATION DE SUPPRESSION */}
      {elementASupprimer && (
        <div className="modale-fond" onClick={() => setElementASupprimer(null)}>
          <div className="modale-boite" onClick={(e) => e.stopPropagation()}>
            <div className="modale-entete">
              <h2>Confirmer la suppression</h2>
              <button
                type="button"
                className="bouton-icone"
                onClick={() => setElementASupprimer(null)}
              >
                <Icone nom="croix" taille={18} />
              </button>
            </div>
            <div className="modale-corps">
              <p>
                Êtes-vous sûr de vouloir supprimer le {onglet === 'fournisseurs' ? 'fournisseur' : 'client'}{' '}
                <strong>« {elementASupprimer.nom} »</strong> ?
              </p>
              <p className="texte-secondaire" style={{ fontSize: '0.86rem' }}>
                Cette action est irréversible. La suppression sera automatiquement refusée par le serveur si ce tiers
                possède des factures associées.
              </p>
            </div>
            <div className="modale-pied">
              <button
                type="button"
                className="btn btn-secondaire"
                onClick={() => setElementASupprimer(null)}
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
