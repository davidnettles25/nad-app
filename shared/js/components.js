/**
 * NAD Test Cycle - Component Loading System
 * File: shared/js/components.js
 * Purpose: Dynamic component loading and management
 */

'use strict';

window.NAD = window.NAD || {};

// Component system
NAD.Components = {
    _registered: new Map(),
    _cache: new Map(),
    
    // Register component
    register(name, componentClass, options = {}) {
        this._registered.set(name, {
            class: componentClass,
            options: options
        });
        NAD.logger.debug(`Component registered: ${name}`);
    },
    
    // Render component
    async render(name, container, props = {}) {
        const element = typeof container === 'string' ? 
            NAD.dom.$(container) : container;
            
        if (!element) {
            throw new Error(`Container not found: ${container}`);
        }
        
        const registration = this._registered.get(name);
        if (!registration) {
            throw new Error(`Component not registered: ${name}`);
        }
        
        const { class: ComponentClass } = registration;
        const instance = new ComponentClass(props);
        
        if (typeof instance.render === 'function') {
            await instance.render(element, props);
            element._nadComponent = instance;
            return instance;
        }
        
        throw new Error(`Component ${name} does not have a render method`);
    },
    
    // Get registered components
    getRegistered() {
        return Array.from(this._registered.keys());
    }
};

// Base component class
NAD.BaseComponent = class {
    constructor(options = {}) {
        this.options = options;
        this.element = null;
        this.props = {};
    }
    
    async render(container, props = {}) {
        this.element = container;
        this.props = props;
        container.innerHTML = '<div>Base Component</div>';
    }
    
    $(selector) {
        return this.element ? NAD.dom.$(selector, this.element) : null;
    }
    
    $$(selector) {
        return this.element ? NAD.dom.$$(selector, this.element) : [];
    }
};

NAD.logger.debug('Component system loaded');
