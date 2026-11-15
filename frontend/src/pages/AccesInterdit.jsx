import { Link } from 'react-router-dom';

export default function AccesInterdit() {
  return <main className="page-erreur"><div className="carte"><p className="date-du-jour">403</p><h1>Accès non autorisé</h1><p className="texte-secondaire">Votre rôle ne permet pas d’ouvrir cette page.</p><Link className="btn btn-primaire" to="/">Retourner à l’accueil</Link></div></main>;
}