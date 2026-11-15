import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import DataTable, { BasculeDensite, MenuColonnes } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';
import Combobox from '../components/ui/Combobox';
import AsyncState from '../components/ui/AsyncState';
import { ExportMenu } from '../components/ui/ExportButton';
import Avatar from '../components/ui/Avatar';
import Icone from '../components/Icone';
import { useAuth } from '../context/AuthContext';
import { estRouteAutorisee } from '../config/roleAccess';
import { LIBELLES_ROLES } from '../utils/format';
import { messageErreur } from '../services/api';
import { listerUtilisateurs } from '../services/utilisateurApi';
import {
  listerEvenements,
  statistiques,
  CATEGORIES_AUDIT,
  RESULTATS_AUDIT,
  ACTIONS_AUDIT,
  CATEGORIE_PAR_ACTION,
} from '../services/auditApi';

const TAILLE_PAGE = 20;

/** Date locale (aaaa-mm-jj) sans décalage de fuseau. */
function isoLocal(date) {
  const a = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const j = String(date.getDate()).padStart(2, '0');
  return `${a}-${m}-${j}`;
}

/** Bornes effectives de la période sélectionnée. */
function bornes(filtres) {
  const aujourdHui = new Date();
  if (filtres.periode === 'aujourdhui') {
    return { dateFrom: isoLocal(aujourdHui), dateTo: isoLocal(aujourdHui) };
  }
  if (filtres.periode === '7j') {
    const debut = new Date(aujourdHui);
    debut.setDate(debut.getDate() - 6);
    return { dateFrom: isoLocal(debut), dateTo: isoLocal(aujourdHui) };
  }
  if (filtres.periode === '30j') {
    const debut = new Date(aujourdHui);
    debut.setDate(debut.getDate() - 29);
    return { dateFrom: isoLocal(debut), dateTo: isoLocal(aujourdHui) };
  }
  return { dateFrom: filtres.dateFrom, dateTo: filtres.dateTo };
}

function horodatage(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso).replace('T', ' ');
  return date.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

/** Date et heure séparées (cellule à deux lignes). */
function partiesHorodatage(iso) {
  if (!iso) return { date: '—', heure: '' };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    const [jour, heure] = String(iso).replace('T', ' ').split(' ');
    return { date: jour || '—', heure: heure || '' };
  }
  return {
    date: date.toLocaleDateString('fr-FR'),
    heure: date.toLocaleTimeString('fr-FR'),
  };
}

/** Libellé français d'un rôle (repli sur la valeur brute). */
function libelleRole(role) {
  return LIBELLES_ROLES[role] || role || '—';
}

/** Route de la page liée à une entité, si le rôle courant peut y accéder. */
function lienEntite(type, id, role) {
  const routes = {
    PIECE: id ? `/pieces/${id}` : null,
    FACTURE: '/factures',
    PAIEMENT: '/paiements',
    UTILISATEUR: '/utilisateurs',
    COMPTE: '/comptes',
    CENTRE_COUT: '/centres-cout',
    BUDGET: '/budgets',
    EXERCICE: '/exercices',
    REPARTITION: '/repartition-couts',
    RAPPORT_ANALYTIQUE: '/rapports-analytiques',
    GRAND_LIVRE: '/grand-livre',
    BALANCE: '/grand-livre',
    JOURNAL_AUDIT: '/audit',
  };
  const chemin = routes[type];
  if (!chemin) return null;
  return estRouteAutorisee(chemin, role) ? chemin : null;
}

/** Parse un JSON de valeur d'audit sans jamais lever d'exception. */
function parser(json) {
  if (!json) return null;
  try {
    const valeur = JSON.parse(json);
    return valeur && typeof valeur === 'object' ? valeur : null;
  } catch {
    return null;
  }
}

function afficherValeur(valeur) {
  if (valeur === null || valeur === undefined) return '—';
  if (typeof valeur === 'object') return JSON.stringify(valeur);
  if (valeur === '') return '—';
  return String(valeur);
}

/** Comparaison champ par champ entre l'ancienne et la nouvelle valeur. */
function comparer(ancien, nouveau) {
  const avant = parser(ancien);
  const apres = parser(nouveau);
  if (!avant && !apres) return [];
  const champs = Array.from(new Set([...Object.keys(avant || {}), ...Object.keys(apres || {})]));
  return champs
    .map((champ) => ({
      champ,
      avant: avant ? avant[champ] : undefined,
      apres: apres ? apres[champ] : undefined,
      change: JSON.stringify(avant ? avant[champ] : null) !== JSON.stringify(apres ? apres[champ] : null),
    }))
    .sort((a, b) => Number(b.change) - Number(a.change) || a.champ.localeCompare(b.champ, 'fr'));
}

const PERIODES = [
  { value: 'aujourdhui', label: "Aujourd'hui" },
  { value: '7j', label: '7 jours' },
  { value: '30j', label: '30 jours' },
  { value: 'perso', label: 'Personnalisée' },
];

export default function JournalAudit() {
  const { role } = useAuth();
  const [params, setParams] = useSearchParams();

  const filtres = useMemo(() => ({
    periode: params.get('periode') || '30j',
    dateFrom: params.get('dateFrom') || '',
    dateTo: params.get('dateTo') || '',
    utilisateurId: params.get('utilisateurId') || '',
    categorie: params.get('categorie') || '',
    action: params.get('action') || '',
    resultat: params.get('resultat') || '',
    q: params.get('q') || '',
    page: Math.max(0, Number(params.get('page') || '0') || 0),
  }), [params]);

  const [donnees, setDonnees] = useState({ content: [], totalElements: 0, totalPages: 0 });
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [selection, setSelection] = useState(null);

  const { dateFrom, dateTo } = useMemo(() => bornes(filtres), [filtres]);

  const parametres = useMemo(() => ({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    utilisateurId: filtres.utilisateurId || undefined,
    categorie: filtres.categorie || undefined,
    action: filtres.action || undefined,
    resultat: filtres.resultat || undefined,
    q: filtres.q || undefined,
  }), [dateFrom, dateTo, filtres]);

  const majFiltre = useCallback((cle, valeur) => {
    setParams((precedents) => {
      const suivants = new URLSearchParams(precedents);
      if (valeur === undefined || valeur === null || valeur === '') suivants.delete(cle);
      else suivants.set(cle, String(valeur));
      if (cle !== 'page') suivants.delete('page');
      return suivants;
    }, { replace: true });
  }, [setParams]);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur('');
    try {
      const [page, statistiques_] = await Promise.all([
        listerEvenements({ page: filtres.page, size: TAILLE_PAGE, ...parametres }),
        statistiques({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
      ]);
      setDonnees({
        content: Array.isArray(page?.content) ? page.content : [],
        totalElements: page?.totalElements || 0,
        totalPages: page?.totalPages || 0,
      });
      setStats(statistiques_ || null);
    } catch (e) {
      setErreur(messageErreur(e));
      setDonnees({ content: [], totalElements: 0, totalPages: 0 });
    } finally {
      setChargement(false);
    }
  }, [filtres.page, parametres, dateFrom, dateTo]);

  useEffect(() => { charger(); }, [charger]);

  useEffect(() => {
    listerUtilisateurs().then((liste) => setUtilisateurs(Array.isArray(liste) ? liste : [])).catch(() => setUtilisateurs([]));
  }, []);

  const optionsUtilisateurs = useMemo(() => utilisateurs.map((u) => ({
    value: String(u.id),
    label: `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || u.email || `Utilisateur ${u.id}`,
  })), [utilisateurs]);

  const optionsCategories = useMemo(
    () => Object.entries(CATEGORIES_AUDIT).map(([value, label]) => ({ value, label })),
    [],
  );
  const optionsResultats = useMemo(
    () => Object.entries(RESULTATS_AUDIT).map(([value, label]) => ({ value, label })),
    [],
  );
  const optionsActions = useMemo(() => Object.entries(ACTIONS_AUDIT).map(([value, label]) => ({
    value,
    label,
    categorie: CATEGORIE_PAR_ACTION[value],
  })), []);

  const actionsFiltrees = useMemo(() => (filtres.categorie
    ? optionsActions.filter((a) => a.categorie === filtres.categorie)
    : optionsActions), [optionsActions, filtres.categorie]);

  const colonnes = useMemo(() => [
    {
      key: 'dateEvenement',
      label: 'Date et heure',
      nowrap: true,
      cell: (e) => {
        const { date, heure } = partiesHorodatage(e.dateEvenement);
        return { principal: <span className="chiffres">{date}</span>, secondaire: heure };
      },
    },
    {
      key: 'utilisateurNom',
      label: 'Utilisateur',
      cell: (e) => ({
        principal: (
          <span className="audit-utilisateur">
            <Avatar utilisateur={{ nom: e.utilisateurNom, email: e.utilisateurNom }} />
            <span>{e.utilisateurNom || 'Anonyme'}</span>
          </span>
        ),
        secondaire: libelleRole(e.utilisateurRole),
      }),
    },
    {
      key: 'action',
      label: 'Action',
      cell: (e) => {
        let entite = '—';
        if (e.entiteType) {
          const chemin = lienEntite(e.entiteType, e.entiteId, role);
          const contenu = (
            <>
              <strong>{e.entiteType}</strong>
              {e.entiteReference ? <> · {e.entiteReference}</> : null}
            </>
          );
          entite = chemin ? <Link to={chemin}>{contenu}</Link> : contenu;
        }
        return {
          principal: (
            <span className="audit-badge" data-categorie={e.categorie}>
              <Icone nom="audit" taille={14} /> {e.actionLibelle || e.action}
            </span>
          ),
          secondaire: entite,
        };
      },
    },
    {
      key: 'resultat',
      label: 'Résultat',
      render: (e) => (
        <span className={`badge badge-${e.resultat === 'ECHEC' ? 'erreur' : 'succes'}`}>
          {e.resultatLibelle || e.resultat}
        </span>
      ),
    },
    { key: 'adresseIp', label: 'IP', priorite: 3, nowrap: true, render: (e) => e.adresseIp || '—' },
  ], [role]);

  function reinitialiser() {
    setParams(new URLSearchParams(), { replace: true });
  }

  const comparaison = useMemo(
    () => (selection ? comparer(selection.ancienneValeur, selection.nouvelleValeur) : []),
    [selection],
  );

  const menuExport = (
    <ExportMenu options={[
      { format: 'pdf', endpoint: '/admin/audit/export/pdf', params: parametres },
      { format: 'csv', endpoint: '/admin/audit/export/csv', params: parametres },
    ]} />
  );

  return (
    <>
      <PageHeader
        title="Journal d'audit"
        description="Historique immuable des actions"
        actions={menuExport}
      />

      <section className="audit-resume" aria-label="Synthèse de la période">
        <div className="audit-kpi">
          <small>Événements</small>
          <strong>{stats ? stats.total : '—'}</strong>
        </div>
        <div className={`audit-kpi${stats && stats.echecs > 0 ? ' danger' : ''}`}>
          <small>Échecs</small>
          <strong>{stats ? stats.echecs : '—'}</strong>
        </div>
        <div className="audit-kpi">
          <small>Utilisateur le plus actif</small>
          <strong>{stats?.utilisateurPlusActif || '—'}</strong>
        </div>
        <div className="audit-kpi">
          <small>Catégorie principale</small>
          <strong>{stats?.categoriePrincipaleLibelle || '—'}</strong>
        </div>
      </section>

      <section className="audit-filtres" aria-label="Filtres du journal">
        <Field id="audit-periode" label="Période">
          {({ id }) => (
            <select id={id} className="input" value={filtres.periode} onChange={(e) => majFiltre('periode', e.target.value)}>
              {PERIODES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          )}
        </Field>
        {filtres.periode === 'perso' && (
          <>
            <Field id="audit-date-from" label="Du">
              {({ id }) => <input id={id} type="date" className="input" value={filtres.dateFrom} onChange={(e) => majFiltre('dateFrom', e.target.value)} />}
            </Field>
            <Field id="audit-date-to" label="Au">
              {({ id }) => <input id={id} type="date" className="input" value={filtres.dateTo} onChange={(e) => majFiltre('dateTo', e.target.value)} />}
            </Field>
          </>
        )}
        <Combobox
          id="audit-utilisateur"
          label="Utilisateur"
          options={optionsUtilisateurs}
          value={filtres.utilisateurId}
          onChange={(v) => majFiltre('utilisateurId', v)}
          placeholder="Tous les utilisateurs"
          vide="Tous les utilisateurs"
        />
        <Combobox
          id="audit-categorie"
          label="Catégorie"
          options={optionsCategories}
          value={filtres.categorie}
          onChange={(v) => { majFiltre('categorie', v); if (v) majFiltre('action', ''); }}
          placeholder="Toutes les catégories"
          vide="Toutes les catégories"
        />
        <Combobox
          id="audit-action"
          label="Action"
          options={actionsFiltrees}
          value={filtres.action}
          onChange={(v) => majFiltre('action', v)}
          placeholder="Toutes les actions"
          vide="Toutes les actions"
        />
        <Combobox
          id="audit-resultat"
          label="Résultat"
          options={optionsResultats}
          value={filtres.resultat}
          onChange={(v) => majFiltre('resultat', v)}
          placeholder="Tous"
          vide="Tous"
        />
        <Field id="audit-recherche" label="Recherche">
          {({ id }) => (
            <input
              id={id}
              type="search"
              className="input"
              placeholder="Utilisateur, référence, détails…"
              value={filtres.q}
              onChange={(e) => majFiltre('q', e.target.value)}
            />
          )}
        </Field>
        <div className="audit-filtres-actions">
          <BasculeDensite />
          <MenuColonnes storageKey="journal-audit" colonnes={colonnes} />
          <Button variant="secondary" type="button" onClick={reinitialiser}>Réinitialiser</Button>
        </div>
      </section>

      <AsyncState
        loading={chargement}
        error={erreur ? erreur : ''}
        onRetry={charger}
        empty={!chargement && !erreur && donnees.content.length === 0}
        emptyTitle="Aucun événement pour ces filtres"
        emptyDescription="Ajustez la période ou réinitialisez les filtres."
      >
        <DataTable
          columns={colonnes}
          rows={donnees.content}
          mode="server"
          storageKey="journal-audit"
          onRowClick={setSelection}
          empty="Aucun événement pour ces filtres."
        />
        <Pagination
          page={filtres.page + 1}
          pageCount={donnees.totalPages}
          onPageChange={(p) => majFiltre('page', p - 1)}
        />
      </AsyncState>

      <Dialog.Root open={Boolean(selection)} onOpenChange={(ouvert) => { if (!ouvert) setSelection(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="ui-drawer-overlay" />
          <Dialog.Content className="ui-drawer" aria-describedby={undefined}>
            <div className="ui-drawer-entete">
              <Dialog.Title asChild><h2>Détail de l'événement</h2></Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="ui-drawer-fermer" aria-label="Fermer">×</button>
              </Dialog.Close>
            </div>
            <div className="ui-drawer-corps">
              {selection && (
                <>
                  <dl className="audit-details">
                    <div className="audit-champ"><dt>Date et heure</dt><dd>{horodatage(selection.dateEvenement)}</dd></div>
                    <div className="audit-champ"><dt>Utilisateur</dt><dd>{selection.utilisateurNom || 'Anonyme'}</dd></div>
                    <div className="audit-champ"><dt>Rôle</dt><dd>{libelleRole(selection.utilisateurRole)}</dd></div>
                    <div className="audit-champ"><dt>Action</dt><dd>{selection.actionLibelle || selection.action}</dd></div>
                    <div className="audit-champ"><dt>Catégorie</dt><dd>{selection.categorieLibelle || selection.categorie || '—'}</dd></div>
                    <div className="audit-champ"><dt>Entité</dt><dd>{selection.entiteType || '—'}</dd></div>
                    <div className="audit-champ"><dt>Référence</dt><dd>{selection.entiteReference || '—'}</dd></div>
                    <div className="audit-champ"><dt>Résultat</dt><dd>{selection.resultatLibelle || selection.resultat}</dd></div>
                    <div className="audit-champ"><dt>Adresse IP</dt><dd>{selection.adresseIp || '—'}</dd></div>
                    <div className="audit-champ"><dt>Request ID</dt><dd>{selection.requestId || '—'}</dd></div>
                    <div className="audit-champ"><dt>Détails</dt><dd>{selection.details || '—'}</dd></div>
                  </dl>

                  {comparaison.length > 0 && (
                    <div>
                      <h3 className="audit-titre-section">Comparaison avant / après</h3>
                      <table className="audit-comparaison">
                        <thead>
                          <tr>
                            <th scope="col">Champ</th>
                            <th scope="col">Avant</th>
                            <th scope="col">Après</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparaison.map((ligne) => (
                            <tr key={ligne.champ}>
                              <th scope="row">{ligne.champ}</th>
                              <td className={ligne.change ? 'audit-avant' : ''}>
                                {ligne.change && <span className="audit-marqueur">Avant : </span>}
                                {afficherValeur(ligne.avant)}
                              </td>
                              <td className={ligne.change ? 'audit-apres' : ''}>
                                {ligne.change && <span className="audit-marqueur">Après : </span>}
                                {afficherValeur(ligne.apres)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
