document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');

            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });

        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            const featuresSection = document.querySelector('.features');
            if (featuresSection) {
                featuresSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
});

window.addEventListener('load', () => {
    const loader = document.getElementById('loader');

    if (loader) {
        loader.classList.add('hidden');

        setTimeout(() => {
            loader.remove();
        }, 500);
    }
});

const copyright = document.getElementById('copyright');
if (copyright) {
    copyright.innerHTML = `© ${new Date().getFullYear()} Nevylish — LiveChat. Tous droits réservés.<br>Non affilié à Twitch, Cacabox ou toute autre marque, plateforme ou personne tierce.`;
}

function launchAnalytics() {
    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-2247536S33';
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
        dataLayer.push(arguments);
    }
    gtag('js', new Date());

    gtag('config', 'G-2247536S33');
}

document.addEventListener('DOMContentLoaded', () => {
    const banner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('accept-cookies');
    const rejectBtn = document.getElementById('reject-cookies');

    const cookieChoice = localStorage.getItem('cookieConsent');

    if (!cookieChoice) {
        banner.style.display = 'flex';
    } else if (cookieChoice === 'true') {
        launchAnalytics();
    }

    acceptBtn.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'true');
        banner.style.display = 'none';
        launchAnalytics();
    });

    rejectBtn.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'false');
        banner.style.display = 'none';
    });
});
