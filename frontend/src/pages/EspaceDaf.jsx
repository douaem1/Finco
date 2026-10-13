import { useAuth } from '../context/AuthContext';
import Icone from '../components/Icone';

/**
 * Page d'accueil minimale pour le Directeur financier.
 * Conforme aux cas d'utilisation prévus :
 * - Valider les paiements (à venir)
 * - Consulter le tableau de bord (à venir)
 */
export default function EspaceDaf() {
  const { utilisateur } = useAuth();
  const dateDuJour = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <section>
      <header className="entete-page">
        <div>
          <p className="date-du-jour">{dateDuJour}</p>
          <h1>Espace Direction financière</h1>
          <p className="texte-secondaire">
            Bienvenue {utilisateur?.prenom} {utilisateur?.nom}. Votre tableau de bord décisionnel et les validations de paiements sont en cours d'intégration.
          </p>
        </div>
      </header>

      <div className="grille-tdb" style={{ marginTop: '1.5rem' }}>
        <article className="carte" style={{ padding: '1.75rem' }}>
          <header className="carte-entete">
            <h2>
              <Icone nom="valide" taille={20} /> Validation des paiements
            </h2>
            <span className="badge badge-neutre">Bientôt disponible</span>
          </header>
          <p className="texte-secondaire" style={{ margin: '1rem 0' }}>
            Ce module permettra au Directeur financier de viser et d'approuver les ordres de virement
            et règlements fournisseurs préparés par l'équipe comptable.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--c-encre-douce)', fontSize: '0.875rem' }}>
            <span>• Circuit de signature électronique</span>
            <span>• Contrôle des plafonds de décaissement</span>
          </div>
        </article>

        <article className="carte" style={{ padding: '1.75rem' }}>
          <header className="carte-entete">
            <h2>
              <Icone nom="balance" taille={20} /> Tableau de bord stratégique
            </h2>
            <span className="badge badge-neutre">Bientôt disponible</span>
          </header>
          <p className="texte-secondaire" style={{ margin: '1rem 0' }}>
            Synthèse globale des indicateurs financiers clés (EBITDA, BFR, trésorerie nette, comparaison réel vs budget analytique).
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--c-encre-douce)', fontSize: '0.875rem' }}>
            <span>• Vision consolidée FI/CO</span>
            <span>• Indicateurs réglementaires marocains</span>
          </div>
        </article>
      </div>
    </section>
  );
}
