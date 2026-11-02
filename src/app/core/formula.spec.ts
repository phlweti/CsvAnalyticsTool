import { describe, expect, it } from 'vitest';
import { evaluateFormula } from './formula';

describe('safe calculated-field formulas', () => {
  const row = { price: '12', quantity: '3', 'First name': 'Ada', 'Last name': 'Lovelace' };

  it('evaluates arithmetic with normal operator precedence', () => {
    expect(evaluateFormula('price * quantity + 2', row)).toBe('38');
    expect(evaluateFormula('(price + 3) / quantity', row)).toBe('5');
  });

  it('supports quoted text and bracketed column names', () => {
    expect(evaluateFormula('[First name] + " " + [Last name]', row)).toBe('Ada Lovelace');
  });

  it('supports a constrained set of safe built-in functions', () => {
    expect(evaluateFormula('ROUND(ABS(price - 15) / quantity, 2)', row)).toBe('1');
    expect(evaluateFormula('UPPER([First name])', row)).toBe('ADA');
  });

  it('reports invalid references and division by zero', () => {
    expect(() => evaluateFormula('missing + 1', row)).toThrow('does not exist');
    expect(() => evaluateFormula('price / 0', row)).toThrow('Division by zero');
  });

  it('does not execute JavaScript expressions', () => {
    expect(() => evaluateFormula('globalThis.alert(1)', row)).toThrow('Unexpected formula input');
  });
});
