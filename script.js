document.addEventListener('DOMContentLoaded', () => {
    const q = (s) => document.querySelectorAll(s), g = (i) => document.getElementById(i);
    const logo = `<svg class="header-logo" width="250" height="60" viewBox="0 0 250 60" xmlns="http://www.w3.org/2000/svg"><path d="M15 45V20c0-5 3-8 7-8h6m-13 16h13" stroke="#1513a3" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M42 45V20c0-5-3-8-7-8-5 0-8 3-8 8v25m0-8h15" stroke="#1513a3" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M38 30l8-8-8-8" stroke="#00AEEF" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><text x="60" y="32" font-family="Arial,sans-serif" font-size="24" font-weight="bold" fill="#1513a3">Fazdad</text><text x="60" y="48" font-family="Arial,sans-serif" font-size="12" fill="#00AEEF" letter-spacing="1">LOGISTICS</text></svg>`;
    const lP = g('logo-placeholder');
    if (lP) lP.innerHTML = logo;
    const obs = new IntersectionObserver((es, o) => {
        es.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('appear');
                o.unobserve(e.target);
            }
        });
    }, { threshold: 0.05, rootMargin: "0px 0px -50px 0px" });

    q('.service-row-v2').forEach(r => obs.observe(r));
    const lB = g('loginFormButton'), rB = g('registerFormButton'), lF = g('loginForm'), rF = g('registerForm');
    if (lB && rB) {
        const t = (isL) => {
            lF.style.display = isL ? "flex" : "none";
            rF.style.display = isL ? "none" : "flex";
            lB.classList.toggle('active-form-btn', isL);
            rB.classList.toggle('active-form-btn', !isL);
        };
        lB.onclick = () => t(1);
        rB.onclick = () => t(0);
    }
    q('.call-btn').forEach(b => b.onclick = () => location.href = 'tel:08036761616');
});