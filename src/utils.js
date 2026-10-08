/**
 * @module utils
 * Shared pure utility functions for data creation, migration, and manipulation.
 * No side effects; all functions are synchronous and deterministic (except generateId).
 */

/**
 * @typedef {{ id: string, name: string }} Item
 * A single grocery item.
 */

/**
 * @typedef {{ id: string, name: string, items: Item[] }} Aisle
 * A named aisle containing zero or more items.
 */

/**
 * @typedef {{ floatingItems: Item[], aisles: Aisle[] }} GroceryList
 * The canonical in-memory list structure persisted to localStorage.
 */

/**
 * @typedef {Record<string, number>} History
 * Maps item names (as typed) to the number of times they have been added.
 */

/**
 * Generates a short, collision-resistant, URL-safe unique ID.
 * Combines a base-36 timestamp with four random characters.
 *
 * @returns {string} A unique identifier string.
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * Returns a fresh empty list in the canonical schema.
 *
 * @returns {GroceryList}
 */
export function emptyList() {
  return { floatingItems: [], aisles: [] };
}

/**
 * Returns `true` when the list has no items **and** no aisles — i.e. nothing
 * to render at all. Handles both the legacy flat-array format and the current
 * structured format.
 *
 * Distinct from {@link listHasItems}, which only cares whether any items exist
 * (ignoring empty aisles).
 *
 * @param {GroceryList | string[] | null | undefined} data
 * @returns {boolean}
 */
export function isListEmpty(data) {
  if (!data || Array.isArray(data)) return !data || data.length === 0;
  const { floatingItems = [], aisles = [] } = data;
  return floatingItems.length === 0 && aisles.length === 0;
}

/**
 * Returns `true` when the list contains at least one item (floating or in an
 * aisle). Empty aisles do not count.
 *
 * Use this to gate interactive actions like sharing; use {@link isListEmpty}
 * to decide whether to render the empty-state message.
 *
 * @param {GroceryList | string[] | null | undefined} data
 * @returns {boolean}
 */
export function listHasItems(data) {
  if (!data || Array.isArray(data)) return Array.isArray(data) && data.length > 0;
  const { floatingItems = [], aisles = [] } = data;
  return floatingItems.length > 0 || aisles.some(a => a.items.length > 0);
}

/**
 * Returns the top `n` item names from a history object, sorted by frequency
 * descending.
 *
 * @param {History} history
 * @param {number} [n=9]
 * @returns {string[]} Item names in descending frequency order, capped at `n`.
 */
export function topItems(history, n = 9) {
  return Object.entries(history)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([name]) => name);
}

/**
 * Parses and validates a raw `emdash-history` JSON string from localStorage.
 * Returns a clean {@link History} object, stripping any entries whose value is
 * not a positive number. Returns `{}` on any parse error or unexpected shape.
 *
 * @param {string | null | undefined} raw - The raw `localStorage` value.
 * @returns {History}
 */
export function migrateHistory(raw) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) return {};
    const clean = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof k === 'string' && typeof v === 'number' && v > 0) clean[k] = v;
    }
    return clean;
  } catch {
    return {};
  }
}

/**
 * Returns `true` when `data` is a valid structured {@link GroceryList}.
 *
 * @param {unknown} data
 * @returns {boolean}
 */
function isValidList(data) {
  return (
    data !== null &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    Array.isArray(data.floatingItems) &&
    Array.isArray(data.aisles)
  );
}

/**
 * Moves an item (identified by `itemId`) to a target aisle (identified by
 * `aisleId`), or back to floating items when `aisleId` is `null`.
 * Returns the original list unchanged if `itemId` is not found.
 *
 * @param {GroceryList} list
 * @param {string} itemId
 * @param {string | null} aisleId - Target aisle ID, or `null` to float the item.
 * @returns {GroceryList} A new list object; the original is not mutated.
 */
export function moveItemToAisle(list, itemId, aisleId) {
  let item = list.floatingItems.find(i => i.id === itemId);
  const cleaned = {
    floatingItems: list.floatingItems.filter(i => i.id !== itemId),
    aisles: list.aisles.map(a => ({ ...a, items: a.items.filter(i => i.id !== itemId) })),
  };
  if (!item) {
    for (const a of list.aisles) {
      item = a.items.find(i => i.id === itemId);
      if (item) break;
    }
  }
  if (!item) return list;
  if (aisleId) {
    return {
      ...cleaned,
      aisles: cleaned.aisles.map(a =>
        a.id === aisleId ? { ...a, items: [...a.items, item] } : a
      ),
    };
  }
  return { ...cleaned, floatingItems: [...cleaned.floatingItems, item] };
}

/**
 * Parses and migrates a raw `emdash-list` JSON string from localStorage into
 * the current {@link GroceryList} schema.
 *
 * Handles two legacy formats:
 * - A flat JSON array of name strings (v1 schema).
 * - Already-valid structured data (passed through unchanged).
 *
 * Returns {@link emptyList} on any parse error or unrecognised shape.
 *
 * @param {string | null | undefined} raw - The raw `localStorage` value.
 * @returns {GroceryList}
 */
export function migrateList(raw) {
  if (!raw) return emptyList();
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      if (data.length === 0) return emptyList();
      return {
        floatingItems: data.map(name => ({ id: generateId(), name: String(name) })),
        aisles: [],
      };
    }
    if (isValidList(data)) return data;
    return emptyList();
  } catch {
    return emptyList();
  }
}
