const logoHTML = `
<svg class="header-logo" width="250" height="60" viewBox="0 0 250 60" xmlns="http://www.w3.org/2000/svg">
    <path d="M15,45 L15,20 C15,15 18,12 22,12 L28,12 M15,28 L28,28" stroke="#1513a3" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M42,45 L42,20 C42,15 39,12 35,12 C30,12 27,15 27,20 L27,45 M27,37 L42,37" stroke="#1513a3" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M38,30 L46,22 L38,14" stroke="#00AEEF" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="60" y="32" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#1513a3">Fazdad</text>
    <text x="60" y="48" font-family="Arial, sans-serif" font-size="12" fill="#00AEEF" letter-spacing="1">LOGISTICS</text>
</svg>
`;

document.addEventListener('DOMContentLoaded', () => {
    const logoContainer = document.getElementById('logo-placeholder');
    if (logoContainer) logoContainer.innerHTML = logoHTML;

    const callButtons = document.querySelectorAll('.call-btn');
    callButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = 'tel:08036761616';
        });
    });

    const revealOptions = { threshold: 0.15 };
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appear');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, revealOptions);

    const serviceRows = document.querySelectorAll('.service-row-v2');
    serviceRows.forEach(row => revealObserver.observe(row));

    const loginBtn = document.getElementById('loginFormButton');
    const registerBtn = document.getElementById('registerFormButton');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginBtn && registerBtn && loginForm && registerForm) {
        const switchToLogin = () => {
            loginForm.style.display = "flex";
            registerForm.style.display = "none";
            loginBtn.style.backgroundColor = "#1513a3"; 
            registerBtn.style.backgroundColor = "transparent";
        };
        
        const switchToReg = () => {
            loginForm.style.display = "none";
            registerForm.style.display = "flex";
            registerBtn.style.backgroundColor = "#1513a3";
            loginBtn.style.backgroundColor = "transparent";
        };

        loginBtn.addEventListener('click', switchToLogin);
        registerBtn.addEventListener('click', switchToReg);
        
        switchToLogin();
    }
});