'use client';

/**
 * Hook gyroscope (prompt v8 livrable 7) — secouer le téléphone pour lancer
 * les dés. iOS : DeviceMotionEvent.requestPermission obligatoire.
 */
import { useEffect, useRef } from 'react';

export function useShake(onShake: () => void, actif = true, seuil = 22) {
  const dernier = useRef(0);
  const dernierT = useRef(0);

  useEffect(() => {
    if (!actif || typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return;

    const handler = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const g = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2);
      const maintenant = Date.now();
      if (g > seuil && maintenant - dernier.current > 800 && maintenant - dernierT.current > 800) {
        dernier.current = maintenant;
        dernierT.current = maintenant;
        onShake();
      }
    };

    window.addEventListener('devicemotion', handler);
    return () => window.removeEventListener('devicemotion', handler);
  }, [actif, onShake, seuil]);
}

/** Active le capteur (demande la permission iOS si requise). */
export async function activerGyroscope(): Promise<boolean> {
  if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return false;
  const dme = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
  if (typeof dme.requestPermission === 'function') {
    try {
      const rep = await dme.requestPermission();
      return rep === 'granted';
    } catch {
      return false;
    }
  }
  return true; // Android : pas de permission explicite
}
