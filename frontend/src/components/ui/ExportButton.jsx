import { useEffect, useRef, useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import api, { messageErreur } from '../../services/api';
import Button from './Button';
import Tooltip from './Tooltip';
import Icone from '../Icone';
import { useToast } from './ToastRegion';

/* Métadonnées d'affichage par format : titre + légende + icône du menu. */
const FORMATS = {
  pdf: { titre: 'Document PDF', legende: 'Mise en page officielle, prêt à imprimer', icone: 'fichier' },
  csv: { titre: 'Fichier CSV', legende: 'Pour Excel et analyse', icone: 'tableur' },
};

/** « pdf » -> « Exporter en PDF » */
function libelleFormat(format) {
  return format === 'csv' ? 'Exporter en CSV' : 'Exporter en PDF';
}

/**
 * Logique d'export partagée : téléchargement du blob, toasts, états
 * (repos / chargement / succès 1,5 s) et relance en cas d'erreur.
 * Un seul export à la fois : tant qu'un export tourne, les autres sont bloqués.
 */
function useExport() {
  const { showToast } = useToast();
  const [enCours, setEnCours] = useState(null);
  const [succes, setSucces] = useState(null);
  const minuteur = useRef(null);

  useEffect(() => () => clearTimeout(minuteur.current), []);

  async function lancer(option) {
    if (!option?.endpoint || enCours) return;
    const format = option.format || 'pdf';
    setEnCours(format);
    try {
      const reponse = await api.get(option.endpoint, { params: option.params || {}, responseType: 'blob' });
      const nom = nomDepuisEntete(reponse.headers?.['content-disposition'],
        option.nomFichierDefaut || `FinCo_export.${format}`);
      telecharger(reponse.data, nom);
      setSucces(format);
      clearTimeout(minuteur.current);
      minuteur.current = setTimeout(() => setSucces(null), 1500);
      showToast(`Export généré : ${nom}`, 'success');
    } catch (erreur) {
      const message = await messageErreurBlob(erreur);
      showToast(message, 'error', { label: 'Réessayer', onClick: () => lancer(option) });
    } finally {
      setEnCours(null);
    }
  }

  return { enCours, succes, lancer };
}

/** Icône de l'état courant (spinner / coche de succès / téléchargement). */
function IconeEtat({ chargement, succes }) {
  if (chargement) return <span className="ui-spinner" aria-hidden="true" />;
  if (succes) return <Icone nom="coche" taille={16} />;
  return <Icone nom="telecharger" taille={16} />;
}

/**
 * Bouton d'export à UN seul format (page ou ligne de tableau).
 * `compact` : bouton icône de 40 px (libellé accessible + infobulle).
 */
export default function ExportButton({
  endpoint,
  format = 'pdf',
  params = {},
  label,
  variante = 'secondary',
  className = '',
  nomFichierDefaut,
  compact = false,
}) {
  const { enCours, succes, lancer } = useExport();
  const chargement = enCours != null;
  const ok = succes != null;
  const texte = label || libelleFormat(format);

  const bouton = (
    <Button
      variant={variante}
      type="button"
      onClick={() => lancer({ endpoint, format, params, nomFichierDefaut })}
      disabled={chargement}
      aria-busy={chargement || undefined}
      aria-label={compact ? texte : undefined}
      className={`ui-export-bouton${compact ? ' ui-export-compact' : ''} ${className}`.trim()}
    >
      <span className="ui-export-libelle">
        <IconeEtat chargement={chargement} succes={ok} />
        {!compact && <span>{chargement ? 'Export en cours…' : texte}</span>}
      </span>
    </Button>
  );

  if (!compact) return bouton;
  return <Tooltip label={texte} side="top">{bouton}</Tooltip>;
}

/**
 * Menu d'export unifié : un seul bouton « Exporter » ouvrant un menu Radix
 * listant les formats disponibles (PDF / CSV). Quand un seul format est
 * fourni, on retombe sur un simple bouton secondaire (règle 4).
 */
export function ExportMenu({
  options = [],
  className = '',
  label = 'Exporter',
  desactive = false,
  raisonDesactive = 'Aucune donnée à exporter',
}) {
  const { enCours, succes, lancer } = useExport();
  const formats = options.filter((option) => option && option.endpoint);

  if (formats.length === 0) return null;
  if (formats.length === 1) return <ExportButton {...formats[0]} className={className} />;

  const chargement = enCours != null;
  const ok = succes != null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={`ui-button ui-button-secondary ui-export-bouton ui-export-menu-trigger ${className}`.trim()}
          aria-label={label}
          aria-haspopup="menu"
          aria-busy={chargement || undefined}
          disabled={chargement}
        >
          <span className="ui-export-libelle">
            <IconeEtat chargement={chargement} succes={ok} />
            <span className="ui-export-texte">{chargement ? 'Export en cours…' : label}</span>
          </span>
          <svg className="ui-export-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="ui-export-menu" align="end" sideOffset={8} collisionPadding={12}>
          {formats.map((option) => {
            const meta = FORMATS[option.format] || FORMATS.pdf;
            const item = (
              <DropdownMenu.Item
                key={option.format}
                className="ui-export-item"
                onSelect={() => lancer(option)}
                disabled={chargement || desactive}
                aria-label={`${meta.titre} — ${meta.legende}`}
              >
                <span className="ui-export-item-icone" aria-hidden="true"><Icone nom={meta.icone} taille={20} /></span>
                <span className="ui-export-item-texte">
                  <strong>{meta.titre}</strong>
                  <small>{meta.legende}</small>
                </span>
              </DropdownMenu.Item>
            );
            return desactive
              ? <Tooltip key={option.format} label={raisonDesactive} side="left">{item}</Tooltip>
              : item;
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/** Extrait « filename=... » d'un en-tête Content-Disposition. */
function nomDepuisEntete(entete, defaut) {
  if (!entete) return defaut;
  const correspondance = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(entete);
  if (!correspondance) return defaut;
  try {
    return decodeURIComponent(correspondance[1]);
  } catch {
    return correspondance[1];
  }
}

/** Téléchargement par URL d'objet temporaire, révoquée une fois le clic déclenché. */
function telecharger(blob, nom) {
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nom;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  URL.revokeObjectURL(url);
}

/** Le serveur renvoie parfois une erreur JSON dans un corps « blob » : on la relit. */
async function messageErreurBlob(erreur) {
  const donnees = erreur?.response?.data;
  if (donnees instanceof Blob) {
    try {
      const texte = await donnees.text();
      const json = JSON.parse(texte);
      if (json?.message) return json.message;
    } catch {
      /* corps illisible : on retombe sur le message générique */
    }
  }
  return messageErreur(erreur);
}
