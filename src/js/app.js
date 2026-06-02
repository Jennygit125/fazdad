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
            if (adminNavLink) adminNavLink.style.display = auth.isAdmin() ? 'block' : 'none';
            if (moderatorNavLink) moderatorNavLink.style.display = auth.isModerator() ? 'block' : 'none';

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
            if (loginNavLink) loginNavLink.style.display = 'block';
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

    const loadProfile = () => {
        const profileGrid = document.getElementById('profile-grid');
        if (!profileGrid) return;
        const user = auth.getCurrentUser();
        if (!user) return;
        profileGrid.innerHTML = `
            <div class="profile-item"><strong>First Name:</strong> <span>${ValidationUtils.sanitizeHtml(user.firstName)}</span></div>
            <div class="profile-item"><strong>Last Name:</strong> <span>${ValidationUtils.sanitizeHtml(user.lastName || '')}</span></div>
            <div class="profile-item"><strong>Email:</strong> <span>${ValidationUtils.sanitizeHtml(user.email)}</span></div>
            <div class="profile-item"><strong>Role:</strong> <span class="role-badge">${user.role}</span></div>
        `;
    };

    const loadUsers = async () => {
        if (!usersBody) return;
        // Inject Skeletons
        usersBody.innerHTML = Array(5).fill(0).map(() => `
            <tr>
                <td><div class="skeleton skeleton-text" style="width: 80%"></div></td>
                <td><div class="skeleton skeleton-text" style="width: 60%"></div></td>
                <td><div class="skeleton skeleton-pill"></div></td>
                <td><div class="skeleton skeleton-pill"></div></td>
                <td><div style="display: flex; gap: 0.5rem;"><div class="skeleton skeleton-btn"></div><div class="skeleton skeleton-btn"></div></div></td>
            </tr>
        `).join('');

        try {
            const response = await UsersService.getAllUsers(); // Returns { users: [...] }
            const users = response.users || [];
            usersBody.innerHTML = users.map((user, index) => {
                const isLocked = user.lockUntil && new Date(user.lockUntil) > new Date();
                const userId = user.id || user._id;
                const fName = ValidationUtils.sanitizeHtml(user.firstName || '');
                const lName = ValidationUtils.sanitizeHtml(user.lastName || '');
                
                return `
                    <tr class="fade-in-up" style="animation-delay: ${index * 0.05}s">
                        <td><strong>${fName || 'Unnamed'} ${lName}</strong></td>
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
            const status = error.status || (error.response && error.response.status);
            if (status === 401 || status === 403) {
                usersBody.innerHTML = `<tr><td colspan="5" class="auth-message error">Access Denied: You do not have permission to view users.</td></tr>`;
            } else {
                usersBody.innerHTML = `<tr><td colspan="5">
                    <div class="auth-message error">Failed to load users: ${error.message}</div>
                    <button class="call-btn" onclick="location.reload()" style="padding: 5px 15px; font-size: 0.8rem;">Retry Connection</button>
                </td></tr>`;
            }
        }
    };

    const loadReports = async () => {
        if (!reportsList) return;
        // Inject Skeletons
        reportsList.innerHTML = Array(3).fill(0).map(() => `
            <div class="info-card" style="margin-bottom: 1rem; border-left: 4px solid #eee;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                    <div class="skeleton skeleton-title" style="width: 40%"></div>
                    <div class="skeleton skeleton-pill"></div>
                </div>
                <div class="skeleton skeleton-text" style="width: 90%"></div>
                <div class="skeleton skeleton-text" style="width: 70%"></div>
            </div>
        `).join('');

        try {
            const role = auth.getUserRole();
            const response = await ReportsService.getReports(role);
            const reports = response.reports || [];
            reportsList.innerHTML = reports.length ? reports.map((report, index) => `
                <div class="info-card fade-in-up" style="margin-bottom: 1rem; border-left: 4px solid var(--accent); animation-delay: ${index * 0.1}s">
                    <div style="display: flex; justify-content: space-between;">
                        <strong>${report.reportType}</strong>
                        <span class="service-tag">${report.priority}</span>
                    </div>
                    <p style="margin: 0.5rem 0;">${report.description}</p>
                    <small><strong>Target:</strong> ${report.contentType} (${report.contentId})</small>
                </div>
            `).join('') : '<div class="info-card"><p>No active reports to display.</p></div>';
        } catch (error) {
            const status = error.status || (error.response && error.response.status);
            if (status === 403) {
                reportsList.innerHTML = `<div class="auth-message error">You are not authorized to view reports.</div>`;
            } else {
                reportsList.innerHTML = `<div class="auth-message error">Network Error: Could not fetch reports.</div>`;
            }
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
                showToast(error.message || 'Operation failed', 'error');
            } finally {
                setLoading(btn, false, originalText);
            }
        });
    }

    // Handle Report Creation
    if (reportForm) {
        const descField = reportForm.querySelector('textarea[name="description"]');
        const counterDisplay = reportForm.querySelector('.char-counter span');
        
        if (descField && counterDisplay) {
            descField.addEventListener('input', () => {
                counterDisplay.textContent = descField.value.length;
            });
        }

        reportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(reportForm);
            const submitBtn = reportForm.querySelector('button');
            
            const reportData = {
                contentId: formData.get('contentId'),
                contentType: formData.get('contentType'),
                reportType: formData.get('reportType'),
                description: formData.get('description'),
                priority: formData.get('priority')
            };

            // Error Resilience: Validate ID format (expecting MongoDB ObjectId)
            if (reportData.contentId.length < 12) {
                return showToast('Invalid Content ID. Please check the source.', 'error');
            }
            
            try {
                setLoading(submitBtn, true);
                await ReportsService.createReport(reportData);
                reportForm.reset();
                await loadReports();
                showToast('Report created successfully!', 'success');
            } catch (error) {
                showToast(error.message || 'Failed to create report', 'error');
            } finally {
                setLoading(submitBtn, false, 'Create Report');
            }
        });
    }

    // Initialize Management Workspaces
    if (auth.isModerator() && (usersBody || reportsList)) {
        if (statusEl) statusEl.textContent = 'Initializing workspace...';
        Promise.all([loadUsers(), loadReports(), loadProfile()]).then(() => {
            if (statusEl) statusEl.textContent = 'Workspace ready.';
        });
    }
});

function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✓' : (type === 'error' ? '!' : 'i');
    
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">${ValidationUtils.sanitizeHtml(message)}</div>
        <button class="toast-close" aria-label="Close notification">&times;</button>
    `;

    container.appendChild(toast);

    const dismiss = () => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    };

    // Auto-dismiss
    const autoDismissTimeout = setTimeout(dismiss, 4000);

    // Manual dismiss
    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(autoDismissTimeout);
        dismiss();
    });
}

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