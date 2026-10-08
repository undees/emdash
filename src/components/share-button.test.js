import { test, expect, describe } from 'bun:test';
import { formatShareText } from './share-button.js';
import { isListEmpty } from '../utils.js';

describe('formatShareText', () => {
  test('formats a legacy flat string array', () => {
    const result = formatShareText(['Milk', 'Bread', 'Eggs']);
    expect(result).toBe('🛒 Em Dash List\n\n• Milk\n• Bread\n• Eggs');
  });

  test('formats floating items only', () => {
    const data = {
      floatingItems: [{ id: 'a1', name: 'Milk' }, { id: 'a2', name: 'Bread' }],
      aisles: [],
    };
    expect(formatShareText(data)).toBe('🛒 Em Dash List\n\n• Milk\n• Bread');
  });

  test('formats aisles only (no floating items)', () => {
    const data = {
      floatingItems: [],
      aisles: [
        { id: 'b1', name: 'Produce', items: [{ id: 'c1', name: 'Lettuce' }, { id: 'c2', name: 'Apples' }] },
      ],
    };
    expect(formatShareText(data)).toBe('🛒 Em Dash List\n\n❧ Produce\n• Lettuce\n• Apples');
  });

  test('formats floating items then aisles, separated by blank lines', () => {
    const data = {
      floatingItems: [{ id: 'a1', name: 'Milk' }],
      aisles: [
        { id: 'b1', name: 'Produce', items: [{ id: 'c1', name: 'Lettuce' }] },
        { id: 'b2', name: 'Dairy', items: [{ id: 'c2', name: 'Butter' }] },
      ],
    };
    const result = formatShareText(data);
    expect(result).toBe(
      '🛒 Em Dash List\n\n• Milk\n\n❧ Produce\n• Lettuce\n\n❧ Dairy\n• Butter'
    );
  });

  test('handles empty structured data gracefully', () => {
    const data = { floatingItems: [], aisles: [] };
    expect(formatShareText(data)).toBe('🛒 Em Dash List\n\n');
  });

  test('includes store name in header when provided', () => {
    const data = {
      floatingItems: [{ id: 'a1', name: 'Milk' }],
      aisles: [],
    };
    expect(formatShareText(data, 'Farm Boy')).toBe('🛒 Em Dash List — Farm Boy\n\n• Milk');
  });

  test('omits store from header when empty string', () => {
    const data = {
      floatingItems: [{ id: 'a1', name: 'Milk' }],
      aisles: [],
    };
    expect(formatShareText(data, '')).toBe('🛒 Em Dash List\n\n• Milk');
  });
});

describe('isListEmpty', () => {
  test('returns true for an empty flat array', () => {
    expect(isListEmpty([])).toBe(true);
  });

  test('returns false for a non-empty flat array', () => {
    expect(isListEmpty(['Milk'])).toBe(false);
  });

  test('returns false when an aisle exists even if it has no items', () => {
    expect(isListEmpty({ floatingItems: [], aisles: [{ id: 'x', name: 'Produce', items: [] }] })).toBe(false);
  });

  test('returns false when there are floating items', () => {
    expect(isListEmpty({ floatingItems: [{ id: 'a', name: 'Milk' }], aisles: [] })).toBe(false);
  });

  test('returns false when an aisle has items', () => {
    const data = {
      floatingItems: [],
      aisles: [{ id: 'b', name: 'Produce', items: [{ id: 'c', name: 'Lettuce' }] }],
    };
    expect(isListEmpty(data)).toBe(false);
  });
});
