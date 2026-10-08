/**
 * @module share-button
 * Share button component and list-formatting utility for the Web Share API.
 */
import { LitElement, html, css } from 'lit';
import { listHasItems } from '../utils.js';

/**
 * Formats a grocery list as a plain-text string suitable for sharing via SMS,
 * email, or any other text channel. Handles both the legacy flat-array format
 * and the current structured format.
 *
 * @param {import('../utils.js').GroceryList | string[]} data
 * @param {string} [store=''] - Optional store name to include in the header.
 * @returns {string} Multi-line text with a header, bullet-point items, and
 *   aisle headings prefixed with ❧.
 *
 * @example
 * formatShareText({ floatingItems: [{ id: '1', name: 'Milk' }], aisles: [] })
 * // → "🛒 Em Dash List\n\n• Milk"
 */
export function formatShareText(data, store = '') {
  const sections = [];

  if (Array.isArray(data)) {
    sections.push(data.map(name => `• ${name}`).join('\n'));
  } else {
    const { floatingItems = [], aisles = [] } = data;
    if (floatingItems.length > 0) {
      sections.push(floatingItems.map(item => `• ${item.name}`).join('\n'));
    }
    for (const aisle of aisles) {
      const itemLines = aisle.items.map(item => `• ${item.name}`).join('\n');
      sections.push(`❧ ${aisle.name}\n${itemLines}`);
    }
  }

  const header = store
    ? `🛒 Em Dash List — ${store}`
    : '🛒 Em Dash List';
  return `${header}\n\n${sections.join('\n\n')}`;
}

/**
 * `<share-button>` — full-width button that invokes the Web Share API to send
 * the current grocery list as plain text. Disabled when the list has no items.
 *
 * @element share-button
 * @prop {import('../utils.js').GroceryList | string[]} items - The current list data.
 */
export class ShareButton extends LitElement {
  static properties = {
    items: { type: Object },
    store: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      margin-top: 1.25rem;
      padding-bottom: 2rem;
    }

    button {
      width: 100%;
      padding: 0.85rem;
      background: var(--green-500);
      color: var(--white);
      border: none;
      border-radius: var(--radius);
      font: inherit;
      font-size: 1.05rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s, opacity 0.15s;
      box-shadow: var(--shadow);
    }

    button:hover:not(:disabled) {
      background: var(--green-600);
    }

    button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `;

  constructor() {
    super();
    this.items = [];
    this.store = '';
  }

  _formatList() {
    return formatShareText(this.items, this.store);
  }

  _isEmpty() {
    return !listHasItems(this.items);
  }

  async _share() {
    if (this._isEmpty()) return;

    try {
      await navigator.share({
        title: 'Em Dash List',
        text: this._formatList(),
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  }

  render() {
    const empty = this._isEmpty();
    return html`
      <button ?disabled=${empty} @click=${this._share}>
        Send Me Shopping
      </button>
    `;
  }
}

customElements.define('share-button', ShareButton);
