/**
 * @module add-item
 * Text input and action buttons for adding items and aisles to the list.
 */
import { LitElement, html, css } from 'lit';

/**
 * `<add-item>` — combined input bar for adding grocery items and named aisles.
 *
 * The input value is shared between both actions; pressing Enter or clicking
 * "Add" fires `add-item`, while clicking "+ Aisle" fires `add-aisle`. The
 * field is cleared automatically after either action.
 *
 * @element add-item
 * @fires {CustomEvent<{ name: string }>} add-item - Fired when the user submits a non-empty item name.
 * @fires {CustomEvent<{ name: string }>} add-aisle - Fired when the user submits a non-empty aisle name.
 */
export class AddItem extends LitElement {
  static properties = {
    _value: { type: String, state: true },
  };

  static styles = css`
    :host {
      display: block;
      flex: 1;
    }

    form {
      display: flex;
      gap: 0;
    }

    input {
      flex: 1;
      min-width: 0;
      padding: 0.6rem 0.75rem;
      border: 2px solid var(--green-200);
      border-right: none;
      border-radius: var(--radius) 0 0 var(--radius);
      font: inherit;
      font-size: 1rem;
      color: var(--text);
      background: var(--white);
      outline: none;
      transition: border-color 0.15s;
    }

    input::placeholder {
      color: var(--text-muted);
    }

    input:focus {
      border-color: var(--green-400);
    }

    .btn-add {
      flex: none;
      padding: 0.6rem 1rem;
      background: var(--green-500);
      color: var(--white);
      border: 2px solid var(--green-500);
      border-radius: 0;
      font: inherit;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-add:hover {
      background: var(--green-600);
      border-color: var(--green-600);
    }

    .btn-aisle {
      flex: none;
      padding: 0.6rem 0.75rem;
      background: var(--green-100);
      color: var(--green-700);
      border: 2px solid var(--green-200);
      border-left: none;
      border-radius: 0 var(--radius) var(--radius) 0;
      font: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      white-space: nowrap;
    }

    .btn-aisle:hover {
      background: var(--green-200);
    }
  `;

  constructor() {
    super();
    this._value = '';
  }

  _onInput(e) {
    this._value = e.target.value;
  }

  _submit(e) {
    e.preventDefault();
    this._addItem();
  }

  _addItem() {
    const name = this._value.trim();
    if (!name) return;
    this.dispatchEvent(new CustomEvent('add-item', {
      detail: { name },
      bubbles: true,
      composed: true,
    }));
    this._value = '';
  }

  _addAisle() {
    const name = this._value.trim();
    if (!name) return;
    this.dispatchEvent(new CustomEvent('add-aisle', {
      detail: { name },
      bubbles: true,
      composed: true,
    }));
    this._value = '';
  }

  render() {
    return html`
      <form @submit=${this._submit}>
        <input
          type="text"
          placeholder="Add something…"
          .value=${this._value}
          @input=${this._onInput}
        >
        <button type="button" class="btn-add" @click=${this._addItem}>Add</button>
        <button type="button" class="btn-aisle" @click=${this._addAisle}>+ Aisle</button>
      </form>
    `;
  }
}

customElements.define('add-item', AddItem);
