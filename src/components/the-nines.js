/**
 * @module the-nines
 * Quick-add popover showing the nine most-frequently-added items as a 3×3 grid.
 */
import { LitElement, html, css } from 'lit';

const GRID_SIZE = 9;

/**
 * `<the-nines>` — collapsible 3×3 grid of quick-add item buttons, populated
 * from the user's add history. Empty cells are rendered as ghost placeholders
 * so the grid shape is always preserved.
 *
 * Tapping a filled cell fires `add-item` (identical to typing and pressing Add).
 * Tapping the ✕ on a cell fires `remove-history-item` so the parent can purge
 * that entry from history without adding it to the list.
 *
 * Hidden entirely when `suggestions` is empty.
 *
 * @element the-nines
 * @prop {string[]} suggestions - Up to 9 item names, pre-sorted by frequency descending.
 * @fires {CustomEvent<{ name: string }>} add-item - Fired when the user taps a cell to add an item.
 * @fires {CustomEvent<{ name: string }>} remove-history-item - Fired when the user taps ✕ to remove an item from history.
 */
export class TheNines extends LitElement {
  static properties = {
    suggestions: { type: Array },
    _open: { type: Boolean, state: true },
  };

  static styles = css`
    :host {
      display: block;
    }

    .trigger {
      background: none;
      border: none;
      color: var(--green-500);
      font: inherit;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      cursor: pointer;
      padding: 0.4rem 0;
      display: block;
      width: 100%;
      text-align: left;
      transition: color 0.15s;
    }

    .trigger:hover {
      color: var(--green-700);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      padding: 0.5rem 0 0.25rem;
    }

    .cell {
      position: relative;
      border-radius: var(--radius, 0.75rem);
      border: 1px solid var(--green-200);
      min-height: 2.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .cell--filled {
      background: var(--green-50, #f1f8f3);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }

    .cell--filled:hover {
      background: var(--green-200);
      border-color: var(--green-400);
    }

    .cell--empty {
      background: transparent;
      border-color: var(--green-100, #e2f1e6);
      opacity: 0.35;
    }

    .cell-label {
      color: var(--green-700);
      font-size: 0.8rem;
      padding: 0.35rem 1.5rem 0.35rem 0.6rem;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }

    .cell-add {
      position: absolute;
      inset: 0;
      background: none;
      border: none;
      cursor: pointer;
      width: 100%;
      height: 100%;
    }

    .cell-remove {
      position: absolute;
      top: 3px;
      right: 3px;
      background: none;
      border: none;
      color: var(--green-300);
      font-size: 0.6rem;
      line-height: 1;
      cursor: pointer;
      padding: 2px 3px;
      border-radius: 999px;
      transition: color 0.15s, background 0.15s;
    }

    .cell-remove:hover {
      color: var(--green-700);
      background: var(--green-200);
    }
  `;

  constructor() {
    super();
    this.suggestions = [];
    this._open = false;
  }

  _toggle() {
    this._open = !this._open;
  }

  _pick(name) {
    this._open = false;
    this.dispatchEvent(new CustomEvent('add-item', {
      detail: { name },
      bubbles: true,
      composed: true,
    }));
  }

  _remove(e, name) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('remove-history-item', {
      detail: { name },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    if (!this.suggestions.length) return html``;

    const cells = [
      ...this.suggestions,
      ...Array(Math.max(0, GRID_SIZE - this.suggestions.length)).fill(null),
    ].slice(0, GRID_SIZE);

    return html`
      <button
        class="trigger"
        aria-expanded="${this._open}"
        @click=${this._toggle}
      >✨ The Nines</button>
      ${this._open ? html`
        <div class="grid">
          ${cells.map(name => name !== null ? html`
            <div class="cell cell--filled">
              <button class="cell-add" @click=${() => this._pick(name)} aria-label="Add ${name}"></button>
              <span class="cell-label">${name}</span>
              <button class="cell-remove" @click=${e => this._remove(e, name)} aria-label="Remove ${name} from history">✕</button>
            </div>
          ` : html`
            <div class="cell cell--empty"></div>
          `)}
        </div>
      ` : ''}
    `;
  }
}

customElements.define('the-nines', TheNines);
