import React from 'react';
import ReactDOM from 'react-dom/client';
import AirtableCRM from './App.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';

class AirtableCRMWebComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.root = null;
  }

  // Define observed attributes
  static get observedAttributes() {
    return ['base-id', 'token', 'height'];
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  // Public API methods for Webex integration
  searchPassenger(query) {
    const event = new CustomEvent('search-passenger', {
      detail: { query },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  setCallerInfo(phoneNumber, name) {
    const event = new CustomEvent('set-caller', {
      detail: { phoneNumber, name },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  render() {
    const baseId = this.getAttribute('base-id');
    const token = this.getAttribute('token');
    const height = this.getAttribute('height') || '100vh';

    if (!baseId || !token) {
      this.shadowRoot.innerHTML = `
        <div style="padding: 20px; color: red;">
          Error: Missing required attributes 'base-id' or 'token'
        </div>
      `;
      return;
    }

    // Create container with Bootstrap styles
    const container = document.createElement('div');
    container.style.height = height;
    container.style.width = '100%';
    
    // Inject Bootstrap CSS into shadow DOM
    const bootstrapLink = document.createElement('link');
    bootstrapLink.rel = 'stylesheet';
    bootstrapLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css';
    
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(bootstrapLink);
    this.shadowRoot.appendChild(container);

    // Create wrapper component that passes props
    const CRMWrapper = () => {
      return (
        <div style={{ height: '100%', width: '100%' }}>
          <AirtableCRM baseId={baseId} token={token} />
        </div>
      );
    };

    // Render React app
    if (!this.root) {
      this.root = ReactDOM.createRoot(container);
    }
    this.root.render(<CRMWrapper />);
  }
}

// Register the custom element
customElements.define('airtable-crm', AirtableCRMWebComponent);

export default AirtableCRMWebComponent;