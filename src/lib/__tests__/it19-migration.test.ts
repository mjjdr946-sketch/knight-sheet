import { describe, it, expect, beforeEach, vi } from 'vitest';
import { evaluerMigration, poserAcquittement } from '../migration';
import { SCHEMA_VERSION } from '../../store/characterStore';

/**
 * Itération 19 (prompt v21) §1 — modale « 🛠 Mise à jour effectuée » :
 * JAMAIS sur un compte neuf (comparaison CHIFFRÉE de la version persistée,
 * acquittement posé d'office pour toute donnée créée par la version courante).
 */

const payload = (version: number) => JSON.stringify({ state: { character: {} }, version });

describe('evaluerMigration — modale versionnée', () => {
  it('aucune donnée persistée → rien (première visite)', () => {
    expect(evaluerMigration(null, null)).toBe('rien');
  });

  it('données créées par la version courante → acquittable (PAS de modale sur un compte neuf)', () => {
    expect(evaluerMigration(payload(SCHEMA_VERSION), null)).toBe('acquittable');
    expect(evaluerMigration(payload(SCHEMA_VERSION + 1), null)).toBe('acquittable');
  });

  it('fiche pré-it. 17 (version < SCHEMA_VERSION) sans ack → modale', () => {
    expect(evaluerMigration(payload(SCHEMA_VERSION - 1), null)).toBe('modale');
    expect(evaluerMigration(payload(0), null)).toBe('modale');
  });

  it('fiche ancienne déjà acquittée → jamais plus de modale', () => {
    expect(evaluerMigration(payload(SCHEMA_VERSION - 1), String(SCHEMA_VERSION))).toBe('rien');
  });

  it('payload illisible → traité comme ancien (modale si pas d\\u2019ack)', () => {
    expect(evaluerMigration('not-json', null)).toBe('modale');
  });

  it('poserAcquittement écrit knight-migration-ack = SCHEMA_VERSION', () => {
    poserAcquittement();
    expect(localStorage.getItem('knight-migration-ack')).toBe(String(SCHEMA_VERSION));
  });
});
