// ---- FADE IN ON SCROLL ----
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// ---- MOBILE NAV ----
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const navCta = document.querySelector('.nav-cta');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    const isOpen = navLinks && navLinks.classList.toggle('mobile-open');
    if (navCta) navCta.classList.toggle('mobile-open', isOpen);
  });
}

// Mobile nav styles injected
const mobileStyle = document.createElement('style');
mobileStyle.textContent = `
  .nav-links.mobile-open {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 70px; left: 0; right: 0;
    background: rgba(15,15,15,0.98);
    backdrop-filter: blur(12px);
    padding: 32px 24px 40px;
    gap: 28px;
    border-bottom: 1px solid rgba(184,155,94,0.15);
    z-index: 99;
  }
  .nav-links.mobile-open a {
    font-size: 1.1rem;
    opacity: 0.85;
  }
  .nav-cta.mobile-open {
    display: block;
    position: fixed;
    bottom: 28px; left: 24px; right: 24px;
    text-align: center;
    z-index: 99;
  }
`;
document.head.appendChild(mobileStyle);

// ---- ACTIVE NAV LINK ----
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(link => {
  if (link.getAttribute('href') === currentPage) {
    link.style.color = 'var(--gold)';
    link.style.opacity = '1';
  }
});
