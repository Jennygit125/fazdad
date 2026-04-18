const AUTH_STORAGE = Object.freeze({
    USERS: "fazdad_secure_users_v1",
    SESSION: "fazdad_session_v1",
});

const HASH_ITERATIONS = 210000;
const DEFAULT_SESSION_HOURS = 8;
const REMEMBER_SESSION_DAYS = 30;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function secureCryptoAvailable() {
    return Boolean(window.crypto && window.crypto.subtle);
}

function randomBytes(length) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    return bytes;
}

function toBase64(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

function fromBase64(value) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function timingSafeEqual(left, right) {
    if (!left || !right || left.length !== right.length) return false;
    let difference = 0;
    for (let i = 0; i < left.length; i += 1) difference |= left[i] ^ right[i];
    return difference === 0;
}

function normalizeUsername(value) {
    return value.trim().toLowerCase();
}

function readJson(storage, key, fallback) {
    try {
        const raw = storage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (_error) {
        return fallback;
    }
}

function writeJson(storage, key, value) {
    storage.setItem(key, JSON.stringify(value));
}

function getStoredUsers() {
    const hasSessionUsers = sessionStorage.getItem(AUTH_STORAGE.USERS) !== null;
    if (hasSessionUsers) {
        const users = readJson(sessionStorage, AUTH_STORAGE.USERS, []);
        return Array.isArray(users) ? users : [];
    }

    // Migrate legacy account data out of localStorage once.
    const hasLegacyUsers = localStorage.getItem(AUTH_STORAGE.USERS) !== null;
    if (!hasLegacyUsers) return [];

    const legacyUsers = readJson(localStorage, AUTH_STORAGE.USERS, []);
    if (Array.isArray(legacyUsers)) {
        writeJson(sessionStorage, AUTH_STORAGE.USERS, legacyUsers);
        localStorage.removeItem(AUTH_STORAGE.USERS);
        return legacyUsers;
    }
    localStorage.removeItem(AUTH_STORAGE.USERS);
    return [];
}

function saveUsers(users) {
    writeJson(sessionStorage, AUTH_STORAGE.USERS, users);
    localStorage.removeItem(AUTH_STORAGE.USERS);
}

async function hashPassword(password, salt, iterations = HASH_ITERATIONS) {
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"],
    );
    const bits = await window.crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
        keyMaterial,
        256,
    );
    return new Uint8Array(bits);
}

async function deriveAesKey(password, salt, iterations = HASH_ITERATIONS) {
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"],
    );
    return window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
    );
}

async function encryptProfile(profile, password) {
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const key = await deriveAesKey(password, salt, HASH_ITERATIONS);
    const plaintext = encoder.encode(JSON.stringify(profile));
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        plaintext,
    );

    return {
        salt: toBase64(salt),
        iv: toBase64(iv),
        ciphertext: toBase64(new Uint8Array(encrypted)),
        iterations: HASH_ITERATIONS,
    };
}

async function decryptProfile(profileData, password) {
    const salt = fromBase64(profileData.salt);
    const iv = fromBase64(profileData.iv);
    const key = await deriveAesKey(
        password,
        salt,
        Number(profileData.iterations) || HASH_ITERATIONS,
    );
    const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        fromBase64(profileData.ciphertext),
    );
    return JSON.parse(decoder.decode(new Uint8Array(decrypted)));
}

function clearSession() {
    sessionStorage.removeItem(AUTH_STORAGE.SESSION);
    localStorage.removeItem(AUTH_STORAGE.SESSION);
}

function saveSession(sessionData, rememberMe) {
    void rememberMe;
    clearSession();
    writeJson(sessionStorage, AUTH_STORAGE.SESSION, sessionData);
}

function getSession() {
    const session = readJson(sessionStorage, AUTH_STORAGE.SESSION, null);
    if (!session) {
        localStorage.removeItem(AUTH_STORAGE.SESSION);
        return null;
    }

    const expiresAt = Date.parse(session.expiresAt || "");
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        clearSession();
        return null;
    }

    localStorage.removeItem(AUTH_STORAGE.SESSION);
    return session;
}

function setAuthMessage(element, message, type) {
    if (!element) return;
    element.textContent = message || "";
    element.classList.remove("success", "error", "info");
    if (type) element.classList.add(type);
}

function getFormFieldValue(form, fieldName) {
    const field = form.elements.namedItem(fieldName);
    if (!field || !("value" in field)) return "";
    return String(field.value || "");
}

function setupLogo(getById) {
    const logo = `<svg class="header-logo" width="250" height="60" viewBox="0 0 250 60" xmlns="http://www.w3.org/2000/svg"><path d="M15 45V20c0-5 3-8 7-8h6m-13 16h13" stroke="#1513a3" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M42 45V20c0-5-3-8-7-8-5 0-8 3-8 8v25m0-8h15" stroke="#1513a3" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M38 30l8-8-8-8" stroke="#00AEEF" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><text x="60" y="32" font-family="Arial,sans-serif" font-size="24" font-weight="bold" fill="#1513a3">Fazdad</text><text x="60" y="48" font-family="Arial,sans-serif" font-size="12" fill="#00AEEF" letter-spacing="1">LOGISTICS</text></svg>`;
    const headerPlaceholder = getById("logo-placeholder");
    const sidebarPlaceholder = getById("sidebar-logo-placeholder");
    if (headerPlaceholder) headerPlaceholder.innerHTML = logo;
    if (sidebarPlaceholder) sidebarPlaceholder.innerHTML = logo;
}

function setupServiceAnimation(queryAll) {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("appear");
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05, rootMargin: "0px 0px -50px 0px" });

    queryAll(".service-row-v2").forEach((row) => observer.observe(row));
}

function setupCallButtons(queryAll) {
    queryAll(".call-btn").forEach((button) => {
        button.onclick = () => {
            window.location.href = "tel:08111321606";
        };
    });
}

function setupDashboardSession(getById, queryAll) {
    const userNameNode = getById("user-name");
    const logoutLinks = queryAll(".logout");
    if (!userNameNode && logoutLinks.length === 0) return;

    const session = getSession();
    if (userNameNode && !session) {
        window.location.href = "login.html";
        return;
    }

    if (userNameNode && session && session.username) {
        userNameNode.textContent = session.username;
    }

    logoutLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            clearSession();
            window.location.href = "index.html";
        });
    });
}

function setupAuth(getById) {
    const loginButton = getById("loginFormButton");
    const registerButton = getById("registerFormButton");
    const loginForm = getById("loginForm");
    const registerForm = getById("registerForm");
    const authMessage = getById("authMessage");
    const rememberCheckbox = getById("rememberMe");
    const forgotPasswordButton = getById("forgotPassword");

    if (!loginButton || !registerButton || !loginForm || !registerForm) return;

    const toggleForms = (showLogin) => {
        loginForm.style.display = showLogin ? "flex" : "none";
        registerForm.style.display = showLogin ? "none" : "flex";
        loginButton.classList.toggle("active-form-btn", showLogin);
        registerButton.classList.toggle("active-form-btn", !showLogin);
        setAuthMessage(authMessage, "", "");
    };

    toggleForms(true);
    loginButton.onclick = () => toggleForms(true);
    registerButton.onclick = () => toggleForms(false);

    if (!secureCryptoAvailable()) {
        setAuthMessage(authMessage, "Secure login is not supported in this browser.", "error");
        loginForm.querySelectorAll("input, button").forEach((node) => {
            node.disabled = true;
        });
        registerForm.querySelectorAll("input, button").forEach((node) => {
            node.disabled = true;
        });
        return;
    }

    if (getSession()) {
        window.location.href = "dashboard.html";
        return;
    }

    if (forgotPasswordButton) {
        forgotPasswordButton.onclick = () => {
            setAuthMessage(
                authMessage,
                "Password reset is not available yet. Please contact support.",
                "info",
            );
        };
    }

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const registerUsername = getFormFieldValue(registerForm, "SetUsername").trim();
        const registerPassword = getFormFieldValue(registerForm, "SetPassword");
        const confirmPassword = getFormFieldValue(registerForm, "confirmPassword");

        if (registerUsername.length < 3) {
            setAuthMessage(authMessage, "Username must be at least 3 characters.", "error");
            return;
        }
        if (registerPassword.length < 8) {
            setAuthMessage(authMessage, "Password must be at least 8 characters.", "error");
            return;
        }
        if (registerPassword !== confirmPassword) {
            setAuthMessage(authMessage, "Passwords do not match.", "error");
            return;
        }

        const users = getStoredUsers();
        const normalized = normalizeUsername(registerUsername);
        if (users.some((entry) => entry.username === normalized)) {
            setAuthMessage(authMessage, "That username already exists. Choose another.", "error");
            return;
        }

        try {
            setAuthMessage(authMessage, "Creating secure account...", "info");
            const createdAt = new Date().toISOString();
            const passwordSalt = randomBytes(16);
            const passwordHash = await hashPassword(registerPassword, passwordSalt, HASH_ITERATIONS);
            const encryptedProfile = await encryptProfile(
                { displayName: registerUsername, createdAt },
                registerPassword,
            );

            users.push({
                username: normalized,
                displayName: registerUsername,
                createdAt,
                password: {
                    salt: toBase64(passwordSalt),
                    hash: toBase64(passwordHash),
                    iterations: HASH_ITERATIONS,
                },
                profile: encryptedProfile,
            });
            saveUsers(users);

            registerForm.reset();
            toggleForms(true);
            loginForm.elements.username.value = registerUsername;
            setAuthMessage(authMessage, "Registration successful. Please log in.", "success");
        } catch (error) {
            console.error("Registration error:", error);
            setAuthMessage(authMessage, "Unable to register right now. Try again.", "error");
        }
    });

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = getFormFieldValue(loginForm, "username").trim();
        const password = getFormFieldValue(loginForm, "password");

        if (!username || !password) {
            setAuthMessage(authMessage, "Enter both username and password.", "error");
            return;
        }

        const users = getStoredUsers();
        const user = users.find((entry) => entry.username === normalizeUsername(username));
        if (!user || !user.password || !user.profile) {
            setAuthMessage(authMessage, "Invalid username or password.", "error");
            return;
        }

        try {
            setAuthMessage(authMessage, "Verifying secure credentials...", "info");
            const passwordSalt = fromBase64(user.password.salt);
            const expectedHash = fromBase64(user.password.hash);
            const computedHash = await hashPassword(
                password,
                passwordSalt,
                Number(user.password.iterations) || HASH_ITERATIONS,
            );

            if (!timingSafeEqual(computedHash, expectedHash)) {
                setAuthMessage(authMessage, "Invalid username or password.", "error");
                return;
            }

            const profile = await decryptProfile(user.profile, password);
            const sessionDuration = rememberCheckbox && rememberCheckbox.checked
                ? REMEMBER_SESSION_DAYS * 24 * 60 * 60 * 1000
                : DEFAULT_SESSION_HOURS * 60 * 60 * 1000;

            saveSession({
                username: profile.displayName || user.displayName || username,
                loginAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + sessionDuration).toISOString(),
            }, Boolean(rememberCheckbox && rememberCheckbox.checked));

            setAuthMessage(authMessage, "Login successful. Redirecting...", "success");
            window.location.href = "dashboard.html";
        } catch (error) {
            console.error("Login error:", error);
            setAuthMessage(authMessage, "Login failed. Check your credentials.", "error");
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const queryAll = (selector) => document.querySelectorAll(selector);
    const getById = (id) => document.getElementById(id);

    setupLogo(getById);
    setupServiceAnimation(queryAll);
    setupCallButtons(queryAll);
    setupAuth(getById);
    setupDashboardSession(getById, queryAll);
});
