/**
 * @module em-dash
 * Root application shell. Owns all list and history state, handles every
 * mutating event from child components, and persists data to localStorage.
 */
import { LitElement, html, css } from 'lit';
import { generateId, migrateList, migrateHistory, emptyList, isListEmpty, moveItemToAisle } from '../utils.js';
import { defaults as aisleDefaults } from '../aisle-defaults.js';
import { lookupFamilect } from '../familect.js';

/**
 * Finds the best-matching aisle label for an item name by scanning
 * `aisle-defaults`. String keys are matched as substrings; RegExp keys are
 * matched non-anchored. When multiple entries match, the longest match wins.
 *
 * @param {string} name - Canonical item name (post-familect resolution), any case.
 * @returns {string | null} The aisle label, or `null` if no entry matches.
 */
function findAisleLabel(name) {
  const n = name.toLowerCase();
  let bestAisle = null;
  let bestLen = 0;
  for (const [key, aisle] of aisleDefaults) {
    if (key instanceof RegExp) {
      const m = n.match(key);
      if (m && m[0].length > bestLen) { bestLen = m[0].length; bestAisle = aisle; }
    } else if (n.includes(key) && key.length > bestLen) {
      bestLen = key.length; bestAisle = aisle;
    }
  }
  return bestAisle;
}
import './add-item.js';
import './grocery-list.js';
import './share-button.js';
import './the-nines.js';

const STORAGE_KEY = 'emdash-list';
const HISTORY_KEY = 'emdash-history';
const STORE_KEY = 'emdash-store';
const BURN_IT_ALL_DOWN = 'BURN IT ALL DOWN';

/**
 * `<em-dash>` — root application shell.
 *
 * Manages the canonical `_list` and `_history` state, wires up all child
 * component events, and persists every mutation to localStorage. Also handles
 * the "BURN IT ALL DOWN" Easter egg (type the phrase into the aisle name field
 * to wipe history).
 *
 * @element em-dash
 */
export class EmDash extends LitElement {
  static properties = {
    _list: { type: Object, state: true },
    _history: { type: Object, state: true },
    _store: { type: String, state: true },
    _editingStore: { type: Boolean, state: true },
    _storeInput: { type: String, state: true },
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 480px;
    }

    header {
      text-align: center;
      padding: 1.5rem 0 1rem;
    }

    h1 {
      font-size: 2rem;
      font-weight: 800;
      color: var(--green-600);
      letter-spacing: -0.02em;
    }

    .tagline {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-top: 0.25rem;
      font-style: italic;
    }

    .store-trigger {
      background: none;
      border: none;
      border-bottom: 1.5px dotted var(--green-400);
      font: inherit;
      font-size: inherit;
      font-style: inherit;
      color: var(--green-500);
      cursor: pointer;
      padding: 0;
      transition: color 0.15s, border-color 0.15s;
    }

    .store-trigger:hover {
      color: var(--green-600);
      border-color: var(--green-600);
    }

    .store-edit {
      display: inline-block;
      width: 7rem;
      padding: 0.1rem 0.3rem;
      border: none;
      border-bottom: 2px solid var(--green-400);
      border-radius: 0;
      background: transparent;
      font: inherit;
      font-size: inherit;
      font-style: inherit;
      color: var(--text);
      text-align: center;
      outline: none;
    }

    .store-edit::placeholder {
      color: var(--text-muted);
      opacity: 0.6;
    }

    .store-clear {
      background: none;
      border: none;
      color: var(--text-muted);
      font: inherit;
      font-size: 0.85rem;
      cursor: pointer;
      padding: 0 0.15rem;
      vertical-align: baseline;
      transition: color 0.15s;
    }

    .store-clear:hover {
      color: var(--green-600);
    }

    .actions {
      margin-top: 1.25rem;
    }

    .empty {
      text-align: center;
      color: var(--text-muted);
      padding: 2.5rem 1rem;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .forget-btn {
      display: block;
      width: 100%;
      background: none;
      border: none;
      color: var(--text-muted);
      font: inherit;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      text-align: center;
      cursor: pointer;
      padding: 0.75rem 0;
      margin-top: 0.5rem;
      transition: color 0.15s;
    }

    .forget-btn:hover {
      color: var(--green-600);
    }
  `;

  constructor() {
    super();
    this._list = migrateList(localStorage.getItem(STORAGE_KEY));
    this._history = migrateHistory(localStorage.getItem(HISTORY_KEY));
    this._store = localStorage.getItem(STORE_KEY) || '';
    this._editingStore = false;
    this._storeInput = '';
  }

  _topNine() {
    return Object.entries(this._history)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 9)
      .map(([name]) => name);
  }

  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._list));
  }

  _recordHistory(name) {
    const history = { ...this._history, [name]: (this._history[name] ?? 0) + 1 };
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    this._history = history;
  }

  _removeHistoryItem(e) {
    const { name } = e.detail;
    const history = { ...this._history };
    delete history[name];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    this._history = history;
  }

  _addItem(e) {
    const name = e.detail.name.trim();
    if (!name) return;

    const canonical = lookupFamilect(name) ?? name;
    const aisleLabel = findAisleLabel(canonical);
    const existingAisle = aisleLabel && this._list.aisles.find(
      a => a.name.toLowerCase() === aisleLabel.toLowerCase()
    );

    if (existingAisle) {
      this._list = {
        ...this._list,
        aisles: this._list.aisles.map(a =>
          a.id === existingAisle.id
            ? { ...a, items: [...a.items, { id: generateId(), name }] }
            : a
        ),
      };
    } else if (aisleLabel) {
      const newAisle = { id: generateId(), name: aisleLabel, items: [{ id: generateId(), name }] };
      this._list = {
        ...this._list,
        aisles: [...this._list.aisles, newAisle],
      };
    } else {
      this._list = {
        ...this._list,
        floatingItems: [...this._list.floatingItems, { id: generateId(), name }],
      };
    }
    this._recordHistory(name);
    this._save();
  }

  _removeItem(e) {
    const { id } = e.detail;
    this._list = {
      floatingItems: this._list.floatingItems.filter(item => item.id !== id),
      aisles: this._list.aisles.map(aisle => ({
        ...aisle,
        items: aisle.items.filter(item => item.id !== id),
      })),
    };
    this._save();
  }

  _addAisle(e) {
    const name = e.detail.name.trim();
    if (!name) return;

    if (name === BURN_IT_ALL_DOWN) {
      localStorage.removeItem(HISTORY_KEY);
      this._history = {};
      return;
    }

    this._list = {
      ...this._list,
      aisles: [...this._list.aisles, { id: generateId(), name, items: [] }],
    };
    this._save();
  }

  _renameAisle(e) {
    const { id, name } = e.detail;
    this._list = {
      ...this._list,
      aisles: this._list.aisles.map(aisle =>
        aisle.id === id ? { ...aisle, name } : aisle
      ),
    };
    this._save();
  }

  _deleteAisle(e) {
    const { id } = e.detail;
    const aisle = this._list.aisles.find(a => a.id === id);
    if (!aisle) return;
    this._list = {
      floatingItems: [...this._list.floatingItems, ...aisle.items],
      aisles: this._list.aisles.filter(a => a.id !== id),
    };
    this._save();
  }

  _renameItem(e) {
    const { id, name } = e.detail;
    this._list = {
      floatingItems: this._list.floatingItems.map(item =>
        item.id === id ? { ...item, name } : item
      ),
      aisles: this._list.aisles.map(aisle => ({
        ...aisle,
        items: aisle.items.map(item =>
          item.id === id ? { ...item, name } : item
        ),
      })),
    };
    this._save();
  }

  _moveItem(e) {
    this._list = moveItemToAisle(this._list, e.detail.id, e.detail.aisleId);
    this._save();
  }

  _startStoreEdit() {
    this._storeInput = this._store;
    this._editingStore = true;
  }

  _saveStoreEdit() {
    if (!this._editingStore) return;
    const store = this._storeInput.trim();
    this._store = store;
    this._editingStore = false;
    this._storeInput = '';
    if (store) {
      localStorage.setItem(STORE_KEY, store);
    } else {
      localStorage.removeItem(STORE_KEY);
    }
  }

  _cancelStoreEdit() {
    this._editingStore = false;
    this._storeInput = '';
  }

  _clearStore() {
    this._store = '';
    this._editingStore = false;
    this._storeInput = '';
    localStorage.removeItem(STORE_KEY);
  }

  _onStoreKeydown(e) {
    if (e.key === 'Enter') { e.preventDefault(); this._saveStoreEdit(); }
    else if (e.key === 'Escape') { this._cancelStoreEdit(); }
  }

  updated(changedProps) {
    super.updated?.(changedProps);
    if (changedProps.has('_editingStore') && this._editingStore) {
      const input = this.shadowRoot.querySelector('.store-edit');
      if (input) { input.focus(); input.select(); }
    }
  }

  _clearList() {
    if (isListEmpty(this._list)) return;
    this._list = emptyList();
    this._save();
  }

  _renderTagline() {
    if (this._editingStore) {
      return html`Errands &amp; munchies from <input
        class="store-edit"
        .value=${this._storeInput}
        @input=${e => { this._storeInput = e.target.value; }}
        @keydown=${this._onStoreKeydown}
        @blur=${this._saveStoreEdit}
        placeholder="store name"
        aria-label="Store name"
      >.`;
    }
    if (this._store) {
      return html`Errands &amp; munchies from <button
        class="store-trigger"
        @click=${this._startStoreEdit}
        aria-label="Change store"
      >${this._store}</button><button
        class="store-clear"
        @click=${this._clearStore}
        aria-label="Clear store"
      >&times;</button>.`;
    }
    return html`Errands &amp; munchies from <button
      class="store-trigger"
      @click=${this._startStoreEdit}
      aria-label="Set store"
    >the store</button>.`;
  }

  render() {
    return html`
      <header>
        <h1>Em Dash</h1>
        <p class="tagline">${this._renderTagline()}</p>
      </header>

      <div class="actions">
        <add-item @add-item=${this._addItem} @add-aisle=${this._addAisle}></add-item>
        <the-nines
          .suggestions=${this._topNine()}
          @add-item=${this._addItem}
          @remove-history-item=${this._removeHistoryItem}
        ></the-nines>
      </div>

      ${isListEmpty(this._list)
        ? html`<p class="empty">The list is empty.<br>Nothing to dash for… yet.</p>`
        : html`<grocery-list
            .listData=${this._list}
            @remove-item=${this._removeItem}
            @rename-item=${this._renameItem}
            @rename-aisle=${this._renameAisle}
            @delete-aisle=${this._deleteAisle}
            @move-item=${this._moveItem}
          ></grocery-list>`
      }

      <share-button .items=${this._list} .store=${this._store}></share-button>

      <button class="forget-btn" @click=${this._clearList}>Forget Everything</button>
    `;
  }
}

customElements.define('em-dash', EmDash);
