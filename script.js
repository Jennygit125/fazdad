// script.js
const logoHTML = `
<svg class="header-logo" width="250" height="60" viewBox="0 0 250 60" xmlns="http://www.w3.org/2000/svg">
    <path d="M15,45 L15,20 C15,15 18,12 22,12 L28,12 M15,28 L28,28" stroke="#1513a3" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M42,45 L42,20 C42,15 39,12 35,12 C30,12 27,15 27,20 L27,45 M27,37 L42,37" stroke="#1513a3" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M38,30 L46,22 L38,14" stroke="#00AEEF" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="60" y="32" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#1513a3">fazdad</text>
    <text x="60" y="48" font-family="Arial, sans-serif" font-size="12" fill="#00AEEF" letter-spacing="1">LOGISTICS</text>
</svg>
`;

// Function to "Input" the logo into the page
window.onload = function() {
    const logoContainer = document.getElementById('logo-placeholder');
    if (logoContainer) {
        logoContainer.innerHTML = logoHTML;
    }
};