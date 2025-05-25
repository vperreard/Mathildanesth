import { Page } from 'puppeteer';

export interface TestUser {
    email: string;
    password: string;
    role: string;
}

export const testUsers = {
    admin: {
        email: 'admin',  // Login, pas email
        password: 'admin',
        role: 'ADMIN'
    },
    testAdmin: {
        email: 'test-admin@mathildanesth.fr',
        password: 'Test123!',
        role: 'ADMIN'
    },
    user: {
        email: 'user@mathildanesth.fr',
        password: 'User123!',
        role: 'USER'
    }
};

/**
 * Se connecter avec un utilisateur
 */
export async function login(page: Page, user: TestUser, baseUrl: string): Promise<void> {
    try {
        // Aller à la page de login
        await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle0' });
        
        // Attendre le formulaire avec plusieurs sélecteurs possibles
        await page.waitForSelector('input[name="login"], input[name="email"], input[type="email"], #login', { timeout: 10000 });
        
        // Remplir login/email
        const loginInput = await page.$('input[name="login"]') ||
                          await page.$('input[name="email"]') || 
                          await page.$('input[type="email"]') || 
                          await page.$('#login') ||
                          await page.$('#email');
        if (loginInput) {
            await loginInput.click({ clickCount: 3 }); // Sélectionner tout
            await loginInput.type(user.email); // user.email contient le login
        }
        
        // Remplir password
        const passwordInput = await page.$('input[name="password"]') || 
                             await page.$('input[type="password"]') || 
                             await page.$('#password');
        if (passwordInput) {
            await passwordInput.click({ clickCount: 3 }); // Sélectionner tout
            await passwordInput.type(user.password);
        }
        
        // Soumettre le formulaire
        const submitBtn = await page.$('button[type="submit"]') || 
                         await page.$('button:has-text("Connexion")') ||
                         await page.$('button:has-text("Se connecter")');
        
        if (submitBtn) {
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle0' }),
                submitBtn.click()
            ]);
        } else {
            // Alternative : soumettre avec Enter
            await page.keyboard.press('Enter');
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
        }
        
        // Vérifier qu'on est bien connecté (pas sur la page de login)
        const currentUrl = page.url();
        if (currentUrl.includes('/auth/login') || currentUrl.includes('/login')) {
            throw new Error('Login failed - still on login page');
        }
        
        // Attendre un peu pour que la session soit bien établie
        await new Promise(resolve => setTimeout(resolve, 1000));
        
    } catch (error) {
        console.error('Login error:', error);
        // Prendre un screenshot pour debug
        await page.screenshot({ 
            path: `./tests/e2e/screenshots/login-error-${Date.now()}.png`,
            fullPage: true 
        });
        throw error;
    }
}

/**
 * Se déconnecter
 */
export async function logout(page: Page, baseUrl: string): Promise<void> {
    try {
        // Chercher le bouton de déconnexion
        const logoutBtn = await page.$('button:has-text("Déconnexion")') ||
                         await page.$('a:has-text("Déconnexion")') ||
                         await page.$('[data-testid="logout-btn"]');
        
        if (logoutBtn) {
            await logoutBtn.click();
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
        } else {
            // Alternative : aller directement à l'URL de logout
            await page.goto(`${baseUrl}/api/auth/logout`, { waitUntil: 'networkidle0' });
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

/**
 * Vérifier si l'utilisateur est connecté
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
    try {
        // Vérifier la présence d'éléments qui indiquent qu'on est connecté
        const userMenu = await page.$('[data-testid="user-menu"]') ||
                        await page.$('.user-menu') ||
                        await page.$('button:has-text("Mon profil")');
        
        return userMenu !== null;
    } catch (error) {
        return false;
    }
}

/**
 * Attendre que la page soit complètement chargée
 */
export async function waitForPageLoad(page: Page): Promise<void> {
    await page.waitForLoadState?.('networkidle') || await page.waitForNavigation?.({ waitUntil: 'networkidle0' });
    // Attendre que les éléments principaux soient visibles
    await page.waitForSelector('body');
    await new Promise(resolve => setTimeout(resolve, 500)); // Petit délai supplémentaire pour les animations
}