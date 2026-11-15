import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function PageIntrouvable() {
  return <main className="page-erreur"><div className="carte"><Logo taille={40} /><p className="date-du-jour">404</p><h1>Page introuvable</h1><p className="texte-secondaire">L’adresse demandée n’existe pas dans FinCo.</p><Link className="btn btn-primaire" to="/">Retourner à l’accueil</Link></div></main>;
}