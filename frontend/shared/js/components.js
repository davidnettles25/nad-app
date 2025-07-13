// NAD Components Loading System - Updated without User Management
console.log('🔄 Loading NAD Components System...');

class NADComponents {
    constructor() {
        this.loadedComponents = new Set();
        this.loadedSections = new Set();
    }
    
    async loadComponent(componentPath, targetSelector) {
        if (this.loadedComponents.has(componentPath)) {
            console.log(`[NADComponents] ⚠️ Component already loaded: ${componentPath}`);
            return;
        }
        
        try {
            console.log(`[NADComponents] Loading component: ${componentPath}`);
            const response = await fetch(componentPath);
            
            if (!response.ok) {
                throw new Error(`Failed to load component: ${response.status}`);
            }
            
            const html = await response.text();
            const target = document.querySelector(targetSelector);
            
            if (target) {
                target.innerHTML = html;
                this.loadedComponents.add(componentPath);
                console.log(`[NADComponents] ✅ Component ${componentPath} loaded successfully`);
            } else {
                console.error(`[NADComponents] ❌ Target selector not found: ${targetSelector}`);
            }
        } catch (error) {
            console.error(`[NADComponents] ❌ Error loading component ${componentPath}:`, error);
        }
    }
    
    async loadSection(sectionName) {
        if (this.loadedSections.has(sectionName)) {
            console.log(`[NADComponents] Section already loaded: ${sectionName}`);
            return;
        }
        
        try {
            console.log(`[NADComponents] Loading section: ${sectionName}`);
            const sectionPath = `admin/sections/${sectionName}.html`;
            const response = await fetch(sectionPath);
            
            if (!response.ok) {
                throw new Error(`Failed to load section: ${response.status}`);
            }
            
            const html = await response.text();
            
            // Create section container if it doesn't exist
            let sectionContainer = document.getElementById(sectionName);
            if (!sectionContainer) {
                sectionContainer = document.createElement('div');
                sectionContainer.id = sectionName;
                sectionContainer.className = 'content-section';
                
                const mainContent = document.querySelector('.main-content') || document.body;
                mainContent.appendChild(sectionContainer);
            }
            
            sectionContainer.innerHTML = html;
            this.loadedSections.add(sectionName);
            console.log(`[NADComponents] ✅ Section ${sectionName} loaded successfully`);
            
        } catch (error) {
            console.error(`[NADComponents] ❌ Error loading section ${sectionName}:`, error);
        }
    }
    
    async loadAdminSections() {
        console.log('🔄 Auto-loading admin sections...');
        
        // Load all admin sections EXCEPT users
        const sections = ['overview', 'tests', 'supplements', 'analytics', 'system'];
        
        for (const section of sections) {
            await this.loadSection(section);
        }
        
        console.log('✅ All admin sections loaded');
    }
    
    // Remove user-related methods
    // loadUserComponents() - DELETED
    // loadUserSections() - DELETED
}

// Global instance
window.NADComponents = new NADComponents();

// Auto-load admin sections when page loads
document.addEventListener('DOMContentLoaded', async function() {
    if (document.querySelector('.admin-dashboard')) {
        await window.NADComponents.loadAdminSections();
    }
});

console.log('✅ NAD Components System loaded (User Management removed)');
