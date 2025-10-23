import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

class AirtableCRMElement extends HTMLElement {
  constructor() {
    super();
    this.root = null;
    this.reactRoot = null;
  }

  static get observedAttributes() {
    return ['base-id', 'token', 'height'];
  }

  connectedCallback() {
    // Create a mount point
    this.root = document.createElement('div');
    this.root.id = 'airtable-crm-root';
    this.appendChild(this.root);

    // Load Bootstrap CSS
    if (!document.getElementById('bootstrap-css')) {
      const link = document.createElement('link');
      link.id = 'bootstrap-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css';
      document.head.appendChild(link);
    }

    this.render();
  }

  disconnectedCallback() {
    if (this.reactRoot) {
      this.reactRoot.unmount();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.root) {
      this.render();
    }
  }

  render() {
    const baseId = this.getAttribute('base-id') || 'appHZBQF9hvM4ESF1';
    const token = this.getAttribute('token') || 'patS19BpxIb9mXnyi.cfca5e985096af92bdc73fc2124cb74ec38990755f14dd79b0e09c5d3d4d1d03';
    const height = this.getAttribute('height') || '100vh';

    // Set container height
    this.root.style.height = height;
    this.root.style.width = '100%';

    // Create or update React root
    if (!this.reactRoot) {
      this.reactRoot = createRoot(this.root);
    }

    this.reactRoot.render(
      <React.StrictMode>
        <App baseId={baseId} token={token} />
      </React.StrictMode>
    );
  }

  // Public API methods for Webex integration
  searchPassenger(query) {
    this.dispatchEvent(new CustomEvent('search-passenger', {
      detail: { query },
      bubbles: true,
      composed: true
    }));
  }

  setCallerInfo(phoneNumber, name) {
    this.dispatchEvent(new CustomEvent('set-caller', {
      detail: { phoneNumber, name },
      bubbles: true,
      composed: true
    }));
  }
}

// Register the custom element
if (!customElements.get('airtable-crm')) {
  customElements.define('airtable-crm', AirtableCRMElement);
}

export default AirtableCRMElement;