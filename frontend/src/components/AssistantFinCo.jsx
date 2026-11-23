import { useEffect, useRef, useState } from 'react';
import { demanderReponseAssistant } from '../services/assistantApi';
import { messageErreur } from '../services/api';
import Icone from './Icone';

const SUGGESTIONS = [
  'Comment équilibrer une écriture ?',
  'Comment analyser un écart budgétaire ?',
  'Quand rattacher une charge à un centre de coûts ?',
];

export default function AssistantFinCo() {
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState([]);
  const [saisie, setSaisie] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const champ = useRef(null);
  const conversation = useRef(null);

  useEffect(() => {
    if (ouvert) champ.current?.focus();
  }, [ouvert]);

  useEffect(() => {
    const panneau = conversation.current;
    if (panneau) panneau.scrollTo({ top: panneau.scrollHeight, behavior: 'smooth' });
  }, [messages, erreur, envoi]);

  async function envoyer(texte = saisie) {
    const contenu = texte.trim();
    if (!contenu || envoi) return;

    const historique = [...messages, { role: 'user', content: contenu }].slice(-8);
    setMessages(historique);
    setSaisie('');
    setErreur('');
    setEnvoi(true);
    try {
      const reponse = await demanderReponseAssistant(historique);
      setMessages((courants) => [...courants, { role: 'assistant', content: reponse }]);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnvoi(false);
      champ.current?.focus();
    }
  }

  function soumettre(e) {
    e.preventDefault();
    envoyer();
  }

  function gererTouches(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      envoyer();
    }
  }

  return (
    <div className="assistant-ancre">
      {ouvert && (
        <section className="assistant-panneau" role="dialog" aria-modal="false" aria-labelledby="assistant-titre">
          <header className="assistant-entete">
            <span className="assistant-marque" aria-hidden="true"><Icone nom="rapport" taille={19} /></span>
            <div>
              <h2 id="assistant-titre">Assistant FinCo</h2>
              <p>Comptabilité &amp; contrôle de gestion</p>
            </div>
            <button type="button" className="assistant-fermer" onClick={() => setOuvert(false)}
              aria-label="Fermer l’assistant">×</button>
          </header>

          <div className="assistant-conversation" ref={conversation} aria-live="polite">
            {messages.length === 0 ? (
              <div className="assistant-bienvenue">
                <p>Bonjour, je peux vous aider à comprendre les écritures, les budgets et les centres de coûts.</p>
                <div className="assistant-suggestions">
                  {SUGGESTIONS.map((suggestion) => (
                    <button type="button" key={suggestion} onClick={() => envoyer(suggestion)} disabled={envoi}>
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : messages.map((message, index) => (
              <p key={`${index}-${message.role}`} className={`assistant-bulle assistant-${message.role}`}>
                {message.content}
              </p>
            ))}
            {envoi && <p className="assistant-attente" role="status">L’assistant prépare une réponse…</p>}
            {erreur && <p className="assistant-erreur" role="alert">{erreur}</p>}
          </div>

          <form className="assistant-formulaire" onSubmit={soumettre}>
            <label className="visuellement-cache" htmlFor="assistant-message">Votre question</label>
            <textarea id="assistant-message" ref={champ} value={saisie} maxLength={1600} rows={2}
              placeholder="Posez une question…" onChange={(e) => setSaisie(e.target.value)}
              onKeyDown={gererTouches} disabled={envoi} />
            <button type="submit" className="assistant-envoyer" disabled={!saisie.trim() || envoi}
              aria-label="Envoyer la question">
              <Icone nom="fleche" taille={18} />
            </button>
            <span>Entrée pour envoyer · Maj + Entrée pour une nouvelle ligne</span>
          </form>

          <p className="assistant-confidentialite">
            Les messages sont envoyés à Google Gemini. L’assistant ne consulte pas vos données FinCo.
            N’incluez aucune donnée personnelle ou financière sensible.
          </p>
        </section>
      )}

      <button type="button" className={`assistant-lanceur ${ouvert ? 'actif' : ''}`}
        onClick={() => setOuvert((v) => !v)} aria-expanded={ouvert}
        aria-label={ouvert ? 'Fermer l’assistant FinCo' : 'Ouvrir l’assistant FinCo'}>
        {ouvert ? '×' : <><span aria-hidden="true">✦</span><span>Assistant</span></>}
      </button>
    </div>
  );
}
