import { redirect } from 'next/navigation';

// Point d'entrée → onglet Combat par défaut
export default function Home() {
  redirect('/personnage/combat');
}
