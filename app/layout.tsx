import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Knight — Feuille de personnage',
  description: "Feuille de personnage interactive et assistant de calcul pour le JDR Knight (Antre Monde Éditions)",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#09090b', // zinc-950
};

/**
 * DOCUMENT 3, règle 7 : data-theme posé sur <html> AVANT l'hydration pour
 * éviter le flash de thème. Le script lit le persist (personnage actif →
 * classe) et pose l'attribut de façon bloquante.
 */
const scriptAntiFlash = `(function(){
  try {
    var raw = localStorage.getItem('knight-sheet-v1');
    var theme = 'guerrier';
    if (raw) {
      var s = JSON.parse(raw).state || {};
      var m = s.character && s.character.metaArmor && s.character.metaArmor.modele;
      var map = { warrior:'guerrier', warmaster:'maitre-de-guerre', rogue:'voleur', ranger:'rodeur', bard:'barde', wizard:'sorcier', barbarian:'barbare', priest:'pretre', paladin:'paladin' };
      if (m && map[m]) theme = map[m];
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'guerrier');
  }
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptAntiFlash }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
