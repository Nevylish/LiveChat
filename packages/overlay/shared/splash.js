/*
 * Copyright (C) 2026 LiveChat by Nevylish
 */

function syncSplashLayout(card) {
    const headline = card.querySelector('.splash-headline');
    const body = card.querySelector('.splash-body');
    const textGroup = card.querySelector('.splash-text-group');
    if (!headline || !body || !textGroup) return;

    textGroup.style.visibility = 'hidden';
    body.style.width = '';
    textGroup.style.width = '';

    const titleWidth = Math.ceil(headline.scrollWidth);

    textGroup.style.visibility = '';
    const bodyStyle = getComputedStyle(body);
    const paddingX = parseFloat(bodyStyle.paddingLeft) + parseFloat(bodyStyle.paddingRight);

    body.style.width = `${titleWidth + paddingX}px`;
    textGroup.style.width = `${titleWidth}px`;
}

function createSplashCard({ message, url = 'livechat.nevylish.fr' }) {
    const card = document.createElement('div');
    card.className = 'splash-card';

    const body = document.createElement('div');
    body.className = 'splash-body';

    const headline = document.createElement('h1');
    headline.className = 'splash-headline';
    headline.textContent = 'LiVECHAT EST PRÊT';

    const textGroup = document.createElement('div');
    textGroup.className = 'splash-text-group';

    const subtitle = document.createElement('p');
    subtitle.className = 'splash-subtitle';
    subtitle.textContent = message;

    const urlEl = document.createElement('p');
    urlEl.className = 'splash-url';
    urlEl.textContent = url;

    textGroup.append(subtitle, urlEl);
    body.append(headline, textGroup);

    const track = document.createElement('div');
    track.className = 'splash-progress-track';
    const bar = document.createElement('div');
    bar.className = 'splash-progress-bar';
    track.appendChild(bar);

    card.append(body, track);
    return card;
}

function mountSplashScreen(container, options) {
    if (!container) return;

    const card = createSplashCard(options);
    container.appendChild(card);

    requestAnimationFrame(() => {
        syncSplashLayout(card);
        if (document.fonts?.ready) {
            document.fonts.ready.then(() => syncSplashLayout(card));
        }
        requestAnimationFrame(() => card.classList.add('fade-in'));
    });

    setTimeout(() => {
        card.classList.remove('fade-in');
        card.classList.add('fade-out');
        setTimeout(() => card.remove(), 500);
    }, 5000);
}
