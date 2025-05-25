const puppeteerConfig = {
    // Configuration du navigateur
    browser: {
        headless: process.env.CI ? true : false, // Mode visible en développement
        slowMo: process.env.CI ? 0 : 50, // Ralentir les actions pour debug
        devtools: !process.env.CI, // DevTools ouvertes en développement
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--window-size=1280,720'
        ]
    },

    // Configuration de la page
    page: {
        viewport: {
            width: 1280,
            height: 720,
            deviceScaleFactor: 1
        },
        defaultTimeout: 30000,
        defaultNavigationTimeout: 60000
    },

    // URLs et environnement
    urls: {
        base: process.env.TEST_BASE_URL || 'http://localhost:3000',
        login: '/auth/login',
        leaves: '/leaves',
        planning: '/planning/hebdomadaire',
        admin: '/admin',
        calendar: '/calendar',
        profile: '/profil',
        notifications: '/notifications',
        blocOperatoire: '/bloc-operatoire',
        statistics: '/statistiques'
    },

    // Utilisateur de test
    testUser: {
        email: 'test@mathildanesth.fr',
        password: 'test123',
        role: 'ADMIN_TOTAL'
    },

    // Sélecteurs couramment utilisés
    selectors: {
        auth: {
            emailInput: 'input[name="email"]',
            passwordInput: 'input[name="password"]',
            loginButton: 'button[type="submit"]',
            loginForm: 'form'
        },
        navigation: {
            userMenu: '[data-testid="user-menu"]',
            planningDropdown: '[data-testid="planning-dropdown"]',
            leavesLink: 'a[href*="/leaves"]'
        },
        leaves: {
            newRequestButton: 'button:has-text("Nouvelle demande")',
            leaveForm: '[data-testid="leave-form"]',
            startDateInput: 'input[name="startDate"]',
            endDateInput: 'input[name="endDate"]',
            leaveTypeSelect: 'select[name="leaveType"]',
            submitButton: 'button[type="submit"]'
        },
        common: {
            loadingSpinner: '.loading, [data-testid="loading"]',
            errorMessage: '.error, [data-testid="error"]',
            successMessage: '.success, [data-testid="success"]'
        },
        calendar: {
            header: '[data-testid="calendar-header"], .calendar-header',
            grid: '[data-testid="calendar-grid"], .calendar-grid',
            controls: '[data-testid="calendar-controls"], .calendar-controls',
            currentMonth: '[data-testid="current-month"], .fc-toolbar-title',
            nextMonth: '[data-testid="next-month"], .fc-next-button',
            prevMonth: '[data-testid="prev-month"], .fc-prev-button'
        },
        profile: {
            header: '[data-testid="profile-header"], .profile-header',
            userInfo: '[data-testid="user-info"], .user-information',
            form: '[data-testid="profile-form"], form',
            counters: '[data-testid="leave-counters"], .leave-balances'
        },
        blocOperatoire: {
            dashboard: '[data-testid="bloc-dashboard"], .dashboard-content',
            planningGrid: '[data-testid="planning-grid"], .rooms-schedule',
            roomsList: '[data-testid="rooms-list"], .rooms-container',
            tramesList: '[data-testid="trames-list"], .trames-container'
        },
        notifications: {
            header: '[data-testid="notifications-header"], .notifications-header',
            list: '[data-testid="notifications-list"], .notifications-container',
            badge: '[data-testid="notification-badge"], .notification-count',
            icon: '[data-testid="notification-icon"], .notification-bell'
        }
    },

    // Timeouts personnalisés
    timeouts: {
        fast: 5000,      // Pour les éléments qui apparaissent rapidement
        medium: 15000,   // Pour les interactions utilisateur normales
        slow: 30000,     // Pour les opérations lentes (authentification, etc.)
        veryLong: 60000  // Pour les opérations très lentes (soumission formulaire)
    }
};

module.exports = puppeteerConfig; 