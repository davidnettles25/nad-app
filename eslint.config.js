// ESLint Configuration
import html from 'eslint-plugin-html';

export default [
    {
        files: ['**/*.html'],
        plugins: {
            html: html
        },
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                window: "readonly",
                document: "readonly",
                console: "readonly",
                alert: "readonly",
                fetch: "readonly",
                setTimeout: "readonly",
                setInterval: "readonly",
                clearTimeout: "readonly",
                clearInterval: "readonly",
                Error: "readonly",
                Date: "readonly",
                Math: "readonly",
                JSON: "readonly",
                Promise: "readonly",
                URL: "readonly",
                URLSearchParams: "readonly",
                FormData: "readonly",
                Element: "readonly",
                HTMLElement: "readonly",
                Event: "readonly",
                NodeList: "readonly",
                HTMLCollection: "readonly",
                // Project-specific globals
                loadSupplements: "writable",
                showAlert: "writable",
                refreshData: "writable",
                loadDashboardStats: "writable",
                initTestManagement: "writable",
                loadTestsFromAPI: "writable",
                loadAllBatches: "writable",
                renderBatchList: "writable",
                updateTestStats: "writable",
                viewTest: "writable",
                viewBatch: "writable",
                loadAnalytics: "writable",
                activateTest: "writable",
                exportAnalytics: "writable",
                showAddSupplementForm: "writable",
                editSupplement: "writable",
                toggleSupplement: "writable",
                testSystemHealth: "writable",
                testAPIEndpoints: "writable",
                showSection: "writable",
                confirm: "readonly"
            }
        },
        rules: {
            // Error Prevention
            "no-console": "off", // Allow console.log for debugging
            "no-alert": "off", // Allow alert for simple UI
            "no-debugger": "error",
            "no-unreachable": "error",
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            "no-undef": "error",
            
            // Code Quality
            "eqeqeq": "warn",
            "curly": "warn",
            "no-var": "warn",
            "prefer-const": "warn",
            "prefer-arrow-callback": "warn",
            
            // Style
            "indent": ["warn", 4],
            "quotes": ["warn", "single", { "avoidEscape": true }],
            "semi": ["warn", "always"],
            "comma-dangle": ["warn", "never"],
            "no-trailing-spaces": "warn",
            "no-multiple-empty-lines": ["warn", { "max": 2 }],
            
            // Best Practices
            "no-eval": "error",
            "no-implied-eval": "error",
            "no-global-assign": "error",
            "no-proto": "error",
            "no-redeclare": "off", // Allow redeclaring globals in HTML context
            "no-shadow": "warn",
            "no-use-before-define": ["error", { "functions": false }]
        }
    }
];