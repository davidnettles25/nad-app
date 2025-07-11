// NAD Component Loading System - Enhanced for Admin Sections
window.NADComponents = {
    config: {
        baseUrl: '',
        debugMode: true
    },

    async loadSection(sectionName, targetSelector = '.main-content') {
        try {
            this.log(`Loading section: ${sectionName}`);
            
            const sectionPath = `admin/sections/${sectionName}.html`;
            const response = await fetch(`${this.config.baseUrl}/${sectionPath}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load section: ${response.status}`);
            }
            
            const html = await response.text();
            const targetElement = document.querySelector(targetSelector);
            
            if (targetElement) {
                // Insert the section HTML
                targetElement.insertAdjacentHTML('beforeend', html);
                this.log(`✅ Section ${sectionName} loaded successfully`);
                return true;
            } else {
                throw new Error(`Target selector ${targetSelector} not found`);
            }
        } catch (error) {
            this.log(`❌ Error loading section ${sectionName}:`, error);
            return false;
        }
    },

    async loadAllSections() {
        const sections = ['overview', 'tests', 'users', 'supplements', 'analytics'];
        
        for (const section of sections) {
            await this.loadSection(section);
            // Small delay between loads to prevent overwhelming the browser
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.log('✅ All admin sections loaded');
    },

    log(message, data = null) {
        if (this.config.debugMode) {
            if (data) {
                console.log(`[NADComponents] ${message}`, data);
            } else {
                console.log(`[NADComponents] ${message}`);
            }
        }
    }
};

// Auto-load sections when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Auto-loading admin sections...');
    await window.NADComponents.loadAllSections();
    
    // Initialize admin dashboard after sections are loaded
    if (typeof window.initializeAdminDashboard === 'function') {
        window.initializeAdminDashboard();
    }
});
