import { Component } from 'react';
import Button from './ui/Button';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return <main className="page-erreur"><div className="carte"><p className="date-du-jour">Erreur inattendue</p><h1>Cette page ne peut pas être affichée.</h1><p className="texte-secondaire">Réessayez ou revenez à votre tableau de bord.</p><Button type="button" onClick={() => window.location.reload()}>Réessayer</Button></div></main>;
  }
}