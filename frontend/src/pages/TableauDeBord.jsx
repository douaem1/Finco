import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listerPieces } from '../services/ecritureApi';
import { messageErreur } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { dateFr, montant } from '../utils/format';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';
import Icone from '../components/Icone';

/* ============================================================
   Tableau de bord : synthèse calculée à partir des pièces
   renvoyées par le serveur (affichage uniquement).
   ============================================================ */

const ROLES_SAISIE = ['COMPTABLE', 'ADMIN'];
const JOURS = 14;

function iso(d) {
  return d.toLocaleDateString('sv-SE');
}

export default function TableauDeBord() {
  const { utilisateur } = useAuth();
  const [pieces, setPieces] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    listerPieces()
      .then(setPieces)
      .catch((e) => setErreur(messageErreur(e)))
      .finally(() => setChargement(false));
  }, []);

  const stats = useMemo(() => {
    const total = pieces.reduce((t, p) => t + Number(p.totalDebit || 0), 0);
    const brouillons = pieces.filter((p) => !p.validee).length;

    // Activité des 14 derniers jours (somme des débits par date d'écriture).
    const aujourdhui = new Date();
    const jours = Array.from({ length: JOURS }, (_, i) => {
      const d = new Date(aujourdhui);
      d.setDate(d.getDate() - (JOURS - 1 - i));
      return { cle: iso(d), jour: d.getDate(), total: 0 };
    });
    const parJour = Object.fromEntries(jours.map((j) => [j.cle, j]));
    pieces.forEach((p) => { if (parJour[p.dateEcriture]) parJour[p.dateEcriture].total += Number(p.totalDebit || 0); });

    // Charges imputées par centre de coûts (lignes au débit portant un centre).
    const centres = {};
    pieces.forEach((p) => p.lignes.forEach((l) => {
      if (l.centreCoutCode && l.sens === 'DEBIT') centres[l.centreCoutCode] = (centres[l.centreCoutCode] || 0) + Number(l.montant);
    }));
    const repartition = Object.entries(centres).sort((a, b) => b[1] - a[1]);

    return { total, brouillons, jours, repartition };
  }, [pieces]);

  const maxJour = Math.max(...stats.jours.map((j) => j.total), 1);
  const maxCentre = Math.max(...stats.repartition.map(([, v]) => v), 1);
  const peutSaisir = ROLES_SAISIE.includes(utilisateur?.role);
  const dateDuJour = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <section>
      <header className="entete-page">
        <div>
          <p className="date-du-jour">{dateDuJour}</p>
          <h1>Bonjour {utilisateur?.prenom} 👋</h1>
        </div>
        {peutSaisir && (
          <Link to="/pieces/nouvelle" className="btn btn-primaire"><Icone nom="plus" taille={18} /> Nouvelle écriture</Link>
        )}
      </header>

      <MessageErreur message={erreur} />
      {chargement ? <Chargement /> : (
        <>
          <div className="kpis">
            <article className="kpi kpi-vedette">
              <span className="kpi-icone"><Icone nom="tendance" /></span>
              <p className="kpi-libelle">Total des mouvements</p>
              <p className="kpi-valeur chiffres">{montant(stats.total)} <small>MAD</small></p>
              <p className="kpi-note">Somme des débits de toutes les pièces</p>
            </article>
            <article className="kpi">
              <span className="kpi-icone"><Icone nom="pieces" /></span>
              <p className="kpi-libelle">Pièces saisies</p>
              <p className="kpi-valeur chiffres">{pieces.length}</p>
              <p className="kpi-note">Exercice 2026</p>
            </article>
            <article className="kpi">
              <span className="kpi-icone kpi-icone-ambre"><Icone nom="horloge" /></span>
              <p className="kpi-libelle">En brouillon</p>
              <p className="kpi-valeur chiffres">{stats.brouillons}</p>
              <p className="kpi-note">À valider</p>
            </article>
            <article className="kpi">
              <span className="kpi-icone kpi-icone-vert"><Icone nom="valide" /></span>
              <p className="kpi-libelle">Validées</p>
              <p className="kpi-valeur chiffres">{pieces.length - stats.brouillons}</p>
              <p className="kpi-note">Définitives</p>
            </article>
          </div>

          <div className="grille-tdb">
            <article className="carte">
              <header className="carte-entete">
                <h2>Activité des 14 derniers jours</h2>
                <span className="texte-secondaire">MAD</span>
              </header>
              <div className="graphe-barres" role="img" aria-label="Montants saisis par jour sur les 14 derniers jours">
                {stats.jours.map((j) => (
                  <div key={j.cle} className="graphe-colonne" title={`${dateFr(j.cle)} : ${montant(j.total)} MAD`}>
                    <span className="graphe-barre" style={{ '--h': `${Math.max(j.total ? 6 : 2, (j.total / maxJour) * 100)}%` }} data-vide={j.total === 0} />
                    <span className="graphe-jour">{j.jour}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="carte">
              <header className="carte-entete">
                <h2>Charges par centre de coûts</h2>
              </header>
              {stats.repartition.length === 0 ? (
                <p className="texte-secondaire carte-vide">Aucune charge imputée pour l’instant.</p>
              ) : (
                <ul className="repartition">
                  {stats.repartition.map(([code, valeur]) => (
                    <li key={code}>
                      <span className="code-centre">{code}</span>
                      <span className="repartition-piste"><span style={{ width: `${(valeur / maxCentre) * 100}%` }} /></span>
                      <b className="chiffres">{montant(valeur)}</b>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>

          <article className="carte">
            <header className="carte-entete">
              <h2>Dernières écritures</h2>
              <Link to="/pieces" className="lien-fleche">Voir le journal <Icone nom="fleche" taille={16} /></Link>
            </header>
            {pieces.length === 0 ? (
              <p className="texte-secondaire carte-vide">Aucune écriture pour l’instant.</p>
            ) : (
              <ul className="recentes">
                {pieces.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <Link to={`/pieces/${p.id}`}>
                      <span className="recentes-icone"><Icone nom="pieces" taille={18} /></span>
                      <span className="recentes-texte">
                        <b>{p.libelle}</b>
                        <small>{p.numero} · {dateFr(p.dateEcriture)}</small>
                      </span>
                      <span className={`statut ${p.validee ? 'statut-validee' : 'statut-brouillon'}`}>{p.validee ? 'Validée' : 'Brouillon'}</span>
                      <b className="chiffres recentes-montant">{montant(p.totalDebit)} MAD</b>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </>
      )}
    </section>
  );
}
