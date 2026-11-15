/**
 * Tests store itération 2 — nouvelles actions (toutes via le moteur).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useCharacterStore, SCHEMA_VERSION } from '../characterStore';
import { personnageExemple } from '../../data/character';
import { computeDerived } from '../../engine/stats';

beforeEach(() => {
  const character = structuredClone(personnageExemple);
  useCharacterStore.setState({ character, derived: computeDerived(character) });
});

const S = () => useCharacterStore.getState();

describe('tirerBlessureAgonie — règle p.90', () => {
  it('1re mise à l\u2019agonie : blessure ajoutée comme condition permanente', () => {
    const r = S().tirerBlessureAgonie(6, 2); // Côtes brisées
    expect(r.mort).toBe(false);
    expect(r.nom).toBe('Côtes brisées');
    expect(S().character.conditions.some((c) => c.nom === 'Côtes brisées')).toBe(true);
    expect(S().character.agonieCoups).toBe(1);
  });

  it('3e mise à l\u2019agonie : MORT', () => {
    S().tirerBlessureAgonie(6, 2);
    S().tirerBlessureAgonie(6, 2);
    const r = S().tirerBlessureAgonie(6, 2);
    expect(r.mort).toBe(true);
    expect(S().character.agonieCoups).toBe(3);
  });

  it('resetCombat remet le compteur d\u2019agonie à zéro', () => {
    S().tirerBlessureAgonie(6, 2);
    expect(S().character.agonieCoups).toBe(1);
    S().resetCombat();
    expect(S().character.agonieCoups).toBe(0);
  });
});

describe('utiliserHeroisme — usages p.96-97', () => {
  it('usage 1 : conserve 1 PS + remise à zéro du compteur d\u2019agonie', () => {
    S().reglerJauge('ps', 0);
    S().tirerBlessureAgonie(6, 2);
    useCharacterStore.setState((s) => ({ character: { ...s.character, jauges: { ...s.character.jauges, heroisme: { current: 2 } } } }));
    const r = S().utiliserHeroisme('ignorer-agonie');
    expect(r.ok).toBe(true);
    expect(S().character.jauges.ps.current).toBe(1);
    expect(S().character.jauges.heroisme.current).toBe(1);
    expect(S().character.agonieCoups).toBe(0);
  });

  it('refus si héroïsme insuffisant', () => {
    const r = S().utiliserHeroisme('ignorer-agonie'); // 0 héroïsme
    expect(r.ok).toBe(false);
  });

  it('carte du destin coûte 3 points', () => {
    useCharacterStore.setState((s) => ({ character: { ...s.character, jauges: { ...s.character.jauges, heroisme: { current: 4 } } } }));
    const r = S().utiliserHeroisme('carte-destin');
    expect(r.ok).toBe(true);
    expect(S().character.jauges.heroisme.current).toBe(1);
  });
});

describe('testerEspoir — règle p.96', () => {
  it('échec : −1D6 PEs appliqué à la jauge', () => {
    const r = S().testerEspoir(false, 4);
    expect(r.perte).toBe(4);
    expect(S().character.jauges.pes.current).toBe(51); // 55 − 4
  });
});

describe('utiliserNod — annexe (3D6 restaurés)', () => {
  it('nod de soin : 3D6 PS, borné au max', () => {
    S().reglerJauge('ps', 10);
    const restaure = S().utiliserNod('soin', 3, 4, 5); // 12
    expect(restaure).toBe(12);
    expect(S().character.jauges.ps.current).toBe(22); // 10 + 12
  });

  it('nod d\u2019énergie : 3D6 PE borné au max (20)', () => {
    S().reglerJauge('pe', 15);
    S().utiliserNod('energie', 2, 2, 2); // 6
    expect(S().character.jauges.pe.current).toBe(20); // borné
  });

  it('nod d\u2019armure : 3D6 PA', () => {
    S().reglerJauge('pa', 100);
    S().utiliserNod('armure', 6, 6, 6); // 18
    expect(S().character.jauges.pa.current).toBe(118);
  });
});

describe('depenserPEUsage + maintenance Shrine — FAQ p.455', () => {
  it('refus si le coût dépasse les PE (règle p.130)', () => {
    expect(S().depenserPEUsage(21)).toBe(false);
  });

  it('maintenance Shrine : −1 PE, refus si le Shrine est inactif', () => {
    expect(S().payerMaintenanceShrine()).toBe(false); // Shrine inactif
    S().activerCapacite('shrine', true);
    const peAvant = S().character.jauges.pe.current;
    expect(S().payerMaintenanceShrine()).toBe(true);
    expect(S().character.jauges.pe.current).toBe(peAvant - 1);
  });
});

describe('sloterArme — évolution 150 PG (p.140, FAQ p.455)', () => {
  it('refus sans l\u2019évolution ; OK à 150 PG pour une arme de tir sans lourd', () => {
    const fusilId = 'fusil-assaut';
    expect(S().sloterArme(fusilId, 'brasDroit')).toBe(false); // gloire 0
    useCharacterStore.setState((s) => ({ character: { ...s.character, gloire: 150 } }));
    expect(S().sloterArme(fusilId, 'brasDroit')).toBe(true);
    expect(S().character.armes.find((a) => a.id === fusilId)?.slotee).toBe('brasDroit');
    // arme slotée considérée « en main »
    S().desloterArme(fusilId);
    expect(S().character.armes.find((a) => a.id === fusilId)?.slotee).toBeUndefined();
  });
});

describe('equiperArme — validation multi-mains (p.87)', () => {
  it('refus d\u2019équiper une arme à deux mains si une autre est en main', () => {
    // fusil d'assaut est à deux mains ; marteau-épieu est équipé
    const ok = S().equiperArme('fusil-assaut', true);
    expect(ok).toBe(false);
  });
});

describe('persistance — version 2 + migrate', () => {
  it('SCHEMA_VERSION = 3', () => {
    expect(SCHEMA_VERSION).toBe(3);
    expect(useCharacterStore.persist.getOptions().version).toBe(3);
  });

  it('migrate v1 : normalise les champs ajoutés (agonieCoups, armes.equipee booléen)', () => {
    const options = useCharacterStore.persist.getOptions();
    const migrate = options.migrate!;
    const v1State = {
      character: {
        ...personnageExemple,
        agonieCoups: undefined,
        armes: personnageExemple.armes.map((a) => ({ ...a, equipee: undefined })),
      },
    } as never;
    const migre = migrate(v1State, 1) as { character: { agonieCoups: number; armes: { equipee: boolean }[] } };
    expect(migre.character.agonieCoups).toBe(0);
    expect(migre.character.armes.every((a) => typeof a.equipee === 'boolean')).toBe(true);
  });
});
