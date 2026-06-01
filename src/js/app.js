const auth = require('./modules/auth');
const UsersService = require('./api/users');
const ReportsService = require('./api/reports');
const ValidationUtils = require('./utils/validation');

document.addEventListener('DOMContentLoaded', async () => {
    // Show a subtle loading state if the backend is waking up
    const statusEl = document.getElementById('management-status');
    if (statusEl) statusEl.textContent = 'Connecting to secure server...';

    // Initialize Auth state from session. 
    // Note: Render free tier may take ~30s to respond if cold.
    await auth.initialize();

    // Clear "Connecting" status for regular users if workspace logic isn't triggered
    if (!auth.isModerator() && statusEl) {
        statusEl.textContent = '';
    }

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Toggle Forms
    const loginBtn = document.getElementById('loginFormButton');
    const registerBtn = document.getElementById('registerFormButton');

    // Handle Navigation Auth UI
    const loginNavLink = document.getElementById('login-nav-link');
    const userNavItem = document.getElementById('user-nav-item');
    const adminNavLink = document.getElementById('admin-nav-link');
    const moderatorNavLink = document.getElementById('moderator-nav-link');

    const updateNavUI = () => {
        const isAuthenticated = auth.getIsAuthenticated();
        const user = auth.getCurrentUser();

        if (isAuthenticated) {
            if (loginNavLink) loginNavLink.style.display = 'none';
            if (adminNavLink) adminNavLink.style.display = auth.isAdmin() ? 'inline-block' : 'none';
            if (moderatorNavLink) moderatorNavLink.style.display = auth.isModerator() ? 'inline-block' : 'none';

            if (userNavItem) {
                userNavItem.style.display = 'flex';
                const btn = userNavItem.querySelector('.dropbtn');
                if (btn) {
                    const span = btn.querySelector('span') || btn;
                    span.textContent = user.firstName || 'Account';
                    btn.setAttribute('data-initial', (user.firstName || 'U').charAt(0).toUpperCase());
                }
            }
        } else {
            if (loginNavLink) loginNavLink.style.display = 'inline-block';
            if (userNavItem) userNavItem.style.display = 'none';
            if (adminNavLink) adminNavLink.style.display = 'none';
            if (moderatorNavLink) moderatorNavLink.style.display = 'none';
        }
    };

    updateNavUI();
    auth.subscribe(updateNavUI);

    // Profile Dropdown Toggle Logic
    const profileBtn = document.querySelector('.dropbtn');
    const dropdownContent = document.querySelector('.dropdown-content');

    if (profileBtn && dropdownContent) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownContent.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            // Only close if the click is outside BOTH the button and the sidebar itself
            if (!profileBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
                dropdownContent.classList.remove('show');
            }
        });
    }

    if (loginBtn && registerBtn && loginForm && registerForm) {
        loginBtn.addEventListener('click', () => {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            loginBtn.classList.add('active-toggle');
            registerBtn.classList.remove('active-toggle');
        });
        registerBtn.addEventListener('click', () => {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            registerBtn.classList.add('active-toggle');
            loginBtn.classList.remove('active-toggle');
        });
    }

    // Logout Logic
    const performLogout = (e) => {
        e.preventDefault();
        auth.logout();
        // Using root-relative path for Vercel cleanUrls compatibility
        window.location.href = '/login';
    };

    const logoutLinks = ['logout-link', 'logout-link-sidebar'];
    logoutLinks.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', performLogout);
    });

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            setLoading(submitBtn, true);

            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const result = await auth.login(data.email, data.password);
                if (result.success) {
                    window.location.href = '/index';
                }
            } catch (error) {
                const status = error.status || (error.response && error.response.status);
                if (status === 403) {
                    showAuthError('Security Lock: Account is temporarily locked.');
                } else if (status === 401) {
                    showAuthError('Invalid email or password.');
                } else {
                    showAuthError(error.message || 'Login failed');
                }
            } finally {
                setLoading(submitBtn, false, originalText);
            }
        });
    }

    // Handle Registration
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            setLoading(submitBtn, true);

            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());

            try {
                if (data.SetPassword !== data.confirmPassword) {
                    throw new Error('Passwords do not match');
                }

                const result = await auth.register(
                    data.firstName, 
                    data.lastName || '', 
                    data.email, 
                    data.SetPassword
                );
                if (result.success) {
                    loginForm.querySelector('[name="email"]').value = data.email;
                    showAuthError('Registration successful! Please login.');
                    loginBtn.click();
                }
            } catch (error) {
                showAuthError(error.message || 'Registration failed');
            } finally {
                setLoading(submitBtn, false, originalText);
            }
        });
    }

    // Handle Dynamic Sidebar Content
    if (dropdownContent && auth.getIsAuthenticated()) {
        const user = auth.getCurrentUser();
        
        // Remove the redundant 'My Profile' link as it's now handled in the header
        const profileLink = dropdownContent.querySelector('a[href="/#auth-profile-section"]');
        if (profileLink) profileLink.remove();

        // Create Sidebar Header if it doesn't exist
        let sidebarHeader = dropdownContent.querySelector('.sidebar-header');
        if (!sidebarHeader) {
            sidebarHeader = document.createElement('div');
            sidebarHeader.className = 'sidebar-header';
            dropdownContent.prepend(sidebarHeader);
        }

        sidebarHeader.innerHTML = `
            <h3>${ValidationUtils.sanitizeHtml(user.firstName)} ${ValidationUtils.sanitizeHtml(user.lastName || '')}</h3>
            <p style="word-break: break-all;">${user.email}</p>
            <span class="role-badge">${user.role || 'user'}</span>
        `;

        // Hide the old on-page profile section
        const userProfileSection = document.getElementById('auth-profile-section');
        if (userProfileSection) userProfileSection.style.display = 'none';
    }

    // Handle User Table Rendering for Admin/Moderator Workspaces
    const usersBody = document.getElementById('users-body');
    const reportsList = document.getElementById('reports-list');
    const reportForm = document.getElementById('reportForm');

    const loadUsers = async () => {
        if (!usersBody) return;
        try {
            const users = await UsersService.getAllUsers();
            usersBody.innerHTML = users.map(user => {
                const isLocked = user.lockedUntil && new Date(user.lockedUntil) > new Date();
                const userId = user.id || user._id;
                const fName = ValidationUtils.sanitizeHtml(user.firstName || '');
                const lName = ValidationUtils.sanitizeHtml(user.lastName || '');
                
                return `
                    <tr>
                        <td><strong>${fName} ${lName}</strong></td>
                        <td>${ValidationUtils.sanitizeHtml(user.email)}</td>
                        <td><span class="role-badge">${user.role}</span></td>
                        <td>
                            <span class="status-pill ${isLocked ? 'locked' : 'active'}" style="padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; background: ${isLocked ? 'var(--error-bg)' : '#e6fff5'}; color: ${isLocked ? 'var(--error-text)' : '#087a4f'};">${isLocked ? 'Locked' : 'Active'}</span>
                        </td>
                        <td>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="call-btn action-btn" style="padding: 5px 10px; font-size: 0.7rem; margin: 0;" data-id="${userId}" data-action="lock">Lock</button>
                                ${auth.isAdmin() && user.role !== 'admin' ? `
                                    <button class="call-btn action-btn" style="padding: 5px 10px; font-size: 0.7rem; margin: 0;" data-id="${userId}" data-action="promote">Promote</button>
                                    <button class="call-btn action-btn" style="padding: 5px 10px; font-size: 0.7rem; margin: 0; background: var(--error-text);" data-id="${userId}" data-action="delete">Delete</button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>`;
            }).join('');
        } catch (error) {
            usersBody.innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
        }
    };

    const loadReports = async () => {
        if (!reportsList) return;
        try {
            const role = auth.getUserRole();
            const reports = await ReportsService.getReports(role);
            reportsList.innerHTML = reports.length ? reports.map(report => `
                <div class="info-card" style="margin-bottom: 1rem; border-left: 4px solid var(--accent);">
                    <div style="display: flex; justify-content: space-between;">
                        <strong>${report.reportType}</strong>
                        <span class="service-tag">${report.priority}</span>
                    </div>
                    <p style="margin: 0.5rem 0;">${report.description}</p>
                    <small>Status: ${report.status} | ID: ${report.contentId}</small>
                </div>
            `).join('') : '<p>No reports found.</p>';
        } catch (error) {
            reportsList.innerHTML = `<p class="auth-message error">Error: ${error.message}</p>`;
        }
    };

    // Handle Action Clicks (Delegation)
    if (usersBody) {
        usersBody.addEventListener('click', async (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const { id, action } = btn.dataset;
            const originalText = btn.textContent;
            
            try {
                setLoading(btn, true);
                if (action === 'lock') {
                    let duration = null;
                    if (auth.isAdmin()) {
                        const input = prompt('Minutes to lock (or leave blank for 1 day):');
                        if (input === null) return; // User cancelled
                        duration = input || null;
                    }
                    await UsersService.lockUser(id, duration);
                } else if (action === 'promote') {
                    if (confirm('Promote this user to Admin?')) await UsersService.promoteToAdmin(id);
                } else if (action === 'delete') {
                    if (confirm('Permanently delete this user?')) await UsersService.deleteUser(id);
                }
                await loadUsers();
            } catch (error) {
                alert(error.message);
            } finally {
                setLoading(btn, false, originalText);
            }
        });
    }

    // Handle Report Creation
    if (reportForm) {
        reportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(reportForm);
            const submitBtn = reportForm.querySelector('button');
            
            try {
                setLoading(submitBtn, true);
                await ReportsService.createReport({
                    contentId: `manual_${Date.now()}`,
                    contentType: 'manual_report',
                    reportType: formData.get('title'),
                    description: formData.get('description')
                });
                reportForm.reset();
                await loadReports();
            } catch (error) {
                alert(error.message);
            } finally {
                setLoading(submitBtn, false, 'Create Report');
            }
        });
    }

    // Initialize Management Workspaces
    if (auth.isModerator() && (usersBody || reportsList)) {
        if (statusEl) statusEl.textContent = 'Initializing workspace...';
        Promise.all([loadUsers(), loadReports()]).then(() => {
            if (statusEl) statusEl.textContent = 'Workspace ready.';
        });
    }
});

function setLoading(button, isLoading, originalText) {
    button.disabled = isLoading;
    button.textContent = isLoading ? 'Processing...' : originalText;
    button.style.opacity = isLoading ? '0.7' : '1';
}

function showAuthError(msg) {
    const authMessage = document.getElementById('authMessage');
    if (authMessage) {
        authMessage.className = 'auth-message error';
        authMessage.textContent = msg;
        authMessage.style.display = 'block';
    }
}