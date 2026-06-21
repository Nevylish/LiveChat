/*
 * Copyright (C) 2025 LiveChat by Nevylish
 */

const SERVER_URL =
    window.location.hostname === 'localhost' ? 'http://localhost:3000' : `https://livechat-api.nevylish.fr`;

const PROXY_HOST = window.location.hostname === 'localhost' ? 'localhost:8787' : 'livechat-proxy.nevylish.workers.dev';

const CONFIG = {
    RECONNECT_ATTEMPTS: 240 /* 240 * 4 = 1 hour ? */,
    RECONNECT_DELAY: 15 * 1000 /* 15 seconds */,
    DISPLAY_DURATION: 8 * 1000 /* 8 seconds */,
    FADE_DURATION: 500 /* 500 milliseconds */,
    MEDIA_LOAD_TIMEOUT: 15 * 1000 /* 15 seconds */,
    SUPPORTED_VIDEO_FORMATS: /\.(mp4|webm|mkv|mov)(?:\?|$)/i,
    SUPPORTED_AUDIO_FORMATS: /\.(mp3|wav|ogg)(?:\?|$)/i,
};

const elements = {
    contentContainer: document.getElementById('content-container'),
    splashContainer: document.getElementById('splash-container'),
    connectionStatus: document.getElementById('connection-status'),
};

const params = new URLSearchParams(window.location.search);
const USERNAME = params.get('username');
const GUILD_ID = params.get('guildId');
const TOKEN = params.get('token');
const NO_SPLASH = params.get('noSplash');

let socket = null;
let currentContent = null;
let currentInteractionId = null;
let currentTimeout = null;
let contentQueue = [];
let isProcessingQueue = false;
let statusTimeout = null;
let isDisconnected = false;
let displaySplash = true;
let splashScreenDisplayed = false;

function initializeSocket(serverUrl) {
    socket = io(serverUrl, {
        reconnection: true,
        reconnectionAttempts: CONFIG.RECONNECT_ATTEMPTS,
        reconnectionDelay: CONFIG.RECONNECT_DELAY,
    });

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('broadcast', handleBroadcast);
    socket.on('updateConnectionStatus', updateConnectionStatus);
    socket.on('skip', handleSkip);
    socket.on('skipById', handleSkipId);
    socket.on('clear', handleClear);
}

function handleConnect() {
    if (!USERNAME) {
        updateConnectionStatus(
            false,
            'Le paramètre ?username est vide, utilisez le site livechat.nevylish.fr pour obtenir votre URL.',
            300000,
        );
        return;
    }

    if (!GUILD_ID) {
        updateConnectionStatus(
            false,
            'Le paramètre ?guildId est vide, utilisez le site livechat.nevylish.fr pour obtenir votre URL.',
            300000,
        );
        return;
    }

    displaySplash = !NO_SPLASH;

    socket.emit(
        'register',
        TOKEN ? { username: USERNAME, guildId: GUILD_ID, token: TOKEN } : { username: USERNAME, guildId: GUILD_ID },
    );
}

function displaySplashScreen() {
    const splashContainer = elements.splashContainer;
    if (splashContainer) {
        const img = document.createElement('img');
        img.src = 'https://cdn.jsdelivr.net/gh/Nevylish/LiveChat@main/shared/assets/images/splash.png';
        splashContainer.appendChild(img);
        img.classList.remove('fade-in', 'fade-out');
        img.classList.add('fade-in');
        splashScreenDisplayed = true;

        setTimeout(() => {
            img.classList.add('fade-out');
            img.classList.remove('fade-in');
            setTimeout(() => {
                if (img.parentNode) {
                    img.parentNode.removeChild(img);
                }
            }, 500);
        }, 5000);
    }
}

function handleDisconnect() {
    updateConnectionStatus(false, 'Connexion au serveur perdue');
}

function handleConnectError(error) {
    console.error('Erreur de connexion\n', error);
    updateConnectionStatus(false, 'Connexion au serveur impossible');
}

function handleBroadcast({ content, from, fullscreen, anonymous, text, interactionId }) {
    console.log('Nouveau livechat reçu:', content, 'de:', from.username, 'interactionId:', interactionId);

    contentQueue.push({ content, from, fullscreen, anonymous, text, interactionId });

    if (!isProcessingQueue) {
        processNextContent();
    }
}

function handleSkip() {
    if (currentInteractionId) socket.emit('ended', currentInteractionId);
    cleanupCurrentContent(() => {
        processNextContent();
    });
}

function handleSkipId(id) {
    const isInQueue = contentQueue.some((item) => item.interactionId === id);

    if (currentInteractionId === id) {
        handleSkip();
        return;
    }

    if (isInQueue) {
        socket.emit('ended', id);
        contentQueue = contentQueue.filter((item) => item.interactionId !== id);
        return;
    }
}

function handleClear() {
    if (contentQueue.length > 0) {
        contentQueue.forEach((item) => socket.emit('ended', item.interactionId));
    }
    contentQueue = [];

    if (currentInteractionId) socket.emit('ended', currentInteractionId);

    cleanupCurrentContent(() => {
        processNextContent();
    });
}

function processNextContent() {
    if (contentQueue.length === 0) {
        isProcessingQueue = false;
        currentInteractionId = null;
        const userInfoElement = document.querySelector('.user-info');
        if (userInfoElement) {
            userInfoElement.classList.remove('fade-in');
            userInfoElement.classList.add('fade-out');
            setTimeout(() => {
                userInfoElement.style.display = 'none';
                userInfoElement.innerHTML = '';
            }, CONFIG.FADE_DURATION);
        }
        return;
    }

    isProcessingQueue = true;
    const { content, from, fullscreen, anonymous, text, interactionId } = contentQueue.shift();

    currentInteractionId = interactionId;

    setTimeout(() => {
        cleanupCurrentContent(() => {
            const element = createContentElement(content, interactionId, from, anonymous, fullscreen);
            if (element) {
                displayContent(element, fullscreen, text);
            }
        });
    }, 100);
}

function cleanupCurrentContent(callback) {
    if (currentTimeout) {
        clearTimeout(currentTimeout);
        currentTimeout = null;
    }

    if (currentContent) {
        if (currentContent.tagName === 'VIDEO' || currentContent.tagName === 'AUDIO') {
            currentContent.controls = false;
        }
        currentContent.classList.add('fade-out');
        const userInfoElement = document.querySelector('.user-info');
        if (userInfoElement) {
            userInfoElement.classList.add('fade-out');
        }
        const textElement = document.querySelector('.content-text');
        if (textElement) {
            textElement.classList.add('fade-out');
        }
        setTimeout(() => {
            if (elements.contentContainer.contains(currentContent)) {
                elements.contentContainer.removeChild(currentContent);
            }
            if (callback) callback();
        }, CONFIG.FADE_DURATION);
    } else {
        if (callback) callback();
    }
}

function createContentElement(content, interactionId, from, anonymous, fullscreen) {
    try {
        const url = new URL(content);
        const filename = url.pathname.split('/').pop() || '';

        const isVideoProxied = url.host.includes(PROXY_HOST) && url.searchParams.get('type') === 'video';
        const isAudioProxied = url.host.includes(PROXY_HOST) && url.searchParams.get('type') === 'audio';

        const isVideo = CONFIG.SUPPORTED_VIDEO_FORMATS.test(filename) || isVideoProxied;
        const isAudio = CONFIG.SUPPORTED_AUDIO_FORMATS.test(filename) || isAudioProxied;

        const element = document.createElement(isVideo ? 'video' : isAudio ? 'audio' : 'img');
        element.src = content;
        element.classList.add('content');
        element.style.opacity = '0';

        if (isVideo || isAudio) {
            element.controls = true;
            element.autoplay = true;
            element.muted = false;
            element.playsInline = true;

            let loadTimeout = setTimeout(() => {
                console.warn('Timeout de chargement du média, skip vers le suivant');
                handleMediaError();
            }, CONFIG.MEDIA_LOAD_TIMEOUT);

            element.onerror = () => {
                clearTimeout(loadTimeout);
                handleMediaError();
            };
            element.onloadeddata = () => {
                clearTimeout(loadTimeout);
                void element.offsetWidth;
                adjustMediaSize(element, fullscreen);
                element.classList.add('fade-in');
                element.play().catch(console.error);
                socket.emit('started', interactionId, element.duration * 1000);
                if (!anonymous) handleUserInfos(from, fullscreen);
            };
            element.addEventListener('ended', () => {
                element.controls = false;
                element.classList.add('fade-out');
                const userInfoElement = document.querySelector('.user-info');
                if (userInfoElement) {
                    userInfoElement.classList.add('fade-out');
                }
                const textElement = document.querySelector('.content-text');
                if (textElement) {
                    textElement.classList.add('fade-out');
                }
                setTimeout(() => {
                    removeContent(element, () => {
                        processNextContent();
                    });
                }, 100);
            });
        } else {
            element.onerror = () => {
                console.error("Erreur de chargement de l'image");
                handleMediaError();
            };
            element.onload = () => {
                void element.offsetWidth;
                adjustMediaSize(element, fullscreen);
                element.classList.add('fade-in');
                socket.emit('started', interactionId);
                if (!anonymous) handleUserInfos(from, fullscreen);
            };

            currentTimeout = setTimeout(() => {
                element.classList.add('fade-out');
                const userInfoElement = document.querySelector('.user-info');
                if (userInfoElement) {
                    userInfoElement.classList.add('fade-out');
                }
                const textElement = document.querySelector('.content-text');
                if (textElement) {
                    textElement.classList.add('fade-out');
                }
                setTimeout(() => {
                    removeContent(element, () => {
                        processNextContent();
                    });
                }, 100);
            }, CONFIG.DISPLAY_DURATION);
        }

        return element;
    } catch (error) {
        console.error("Erreur lors de l'affichage du livechat\n", error);
        return null;
    }
}

function displayContent(element, fullscreen, text) {
    elements.contentContainer.appendChild(element);
    currentContent = element;
    if (currentContent.tagName === 'VIDEO' || currentContent.tagName === 'AUDIO') {
        currentContent.controls = false;
    }
    elements.contentContainer.style.display = 'block';
    if (fullscreen) {
        currentContent.classList.add('fullscreen');
        elements.contentContainer.classList.add('fullscreen');
    } else {
        currentContent.classList.remove('fullscreen');
        elements.contentContainer.classList.remove('fullscreen');
    }

    if (text) {
        createTextElement(text, fullscreen);
    }
}

function createTextElement(text, fullscreen) {
    const existingText = document.querySelector('.content-text');
    if (existingText) {
        existingText.remove();
    }

    const textElement = document.createElement('div');
    textElement.className = 'content-text';
    textElement.textContent = text;

    if (fullscreen) {
        textElement.classList.add('fullscreen');
    }

    elements.contentContainer.appendChild(textElement);

    void textElement.offsetWidth;
    textElement.classList.add('fade-in');
}

function removeContent(element, callback) {
    if (elements.contentContainer.contains(element)) {
        if (currentInteractionId) socket.emit('ended', currentInteractionId);
        elements.contentContainer.removeChild(element);
        elements.contentContainer.style.display = 'none';
        elements.contentContainer.classList.remove('fullscreen');
        currentContent = null;
    }

    const textElement = document.querySelector('.content-text');
    if (textElement) {
        textElement.remove();
    }

    if (callback) callback();
}

function handleUserInfos(from, fullscreen) {
    let userInfoElement = document.querySelector('.user-info');

    if (!userInfoElement) {
        userInfoElement = document.createElement('div');
        userInfoElement.className = 'user-info';
        document.body.appendChild(userInfoElement);
    }

    userInfoElement.innerHTML = '';

    const avatarContainer = document.createElement('div');
    avatarContainer.className = 'user-avatar';

    const avatarImg = document.createElement('img');
    avatarImg.src = from.avatarURL;
    avatarContainer.appendChild(avatarImg);

    userInfoElement.appendChild(avatarContainer);

    const usernameDiv = document.createElement('div');
    usernameDiv.className = 'user-username';
    // TODO: displayname est toujours null, sûrement besoin du Server Members Intent
    usernameDiv.textContent = from.displayname ?? from.username;
    userInfoElement.appendChild(usernameDiv);

    elements.contentContainer.appendChild(userInfoElement);

    userInfoElement.style.display = 'flex';

    void userInfoElement.offsetWidth;

    if (fullscreen) {
        userInfoElement.classList.add('fullscreen');
        avatarContainer.classList.add('fullscreen');
        avatarImg.classList.add('fullscreen');
    } else {
        userInfoElement.classList.remove('fullscreen');
        avatarContainer.classList.remove('fullscreen');
        avatarImg.classList.remove('fullscreen');
    }

    avatarImg.classList.remove('fade-in', 'fade-out');
    userInfoElement.classList.remove('fade-in', 'fade-out');
    setTimeout(() => {
        avatarImg.classList.add('fade-in');
        userInfoElement.classList.add('fade-in');
    }, 50);
}

function handleMediaError(error) {
    console.error('Erreur de chargement du média\n', error);
    processNextContent();
}

function updateConnectionStatus(connected, message = '', timeout = 5000) {
    if (statusTimeout) {
        clearTimeout(statusTimeout);
    }

    if (isDisconnected && !connected) {
        return;
    }

    elements.connectionStatus.style.display = 'block';
    elements.connectionStatus.classList.remove('fade-out');
    elements.connectionStatus.className = connected ? 'connected' : 'disconnected';
    elements.connectionStatus.textContent = connected
        ? `Connecté à LiveChat${message ? `${message}` : ''}`
        : `Déconnecté de LiveChat${message ? `: ${message}` : ''}`;

    void elements.connectionStatus.offsetWidth;

    elements.connectionStatus.classList.add('fade-in');

    if (connected) {
        if (displaySplash && !splashScreenDisplayed) {
            displaySplashScreen();
        }
    }

    statusTimeout = setTimeout(() => {
        elements.connectionStatus.classList.remove('fade-in');
        elements.connectionStatus.classList.add('fade-out');
        setTimeout(() => {
            elements.connectionStatus.style.display = 'none';
        }, 500);
    }, timeout);

    isDisconnected = !connected;
}

function adjustMediaSize(element, fullscreen) {
    if (element.tagName === 'AUDIO') return;

    if (fullscreen) {
        element.style.width = '';
        element.style.height = '';
        return;
    }

    let naturalWidth = 0;
    let naturalHeight = 0;

    if (element.tagName === 'IMG') {
        naturalWidth = element.naturalWidth;
        naturalHeight = element.naturalHeight;
    } else if (element.tagName === 'VIDEO') {
        naturalWidth = element.videoWidth;
        naturalHeight = element.videoHeight;
    }

    if (!naturalWidth || !naturalHeight) return;

    const targetMin = 600;

    let width = naturalWidth;
    let height = naturalHeight;

    if (width < targetMin && height < targetMin) {
        const ratio = width / height;
        if (width >= height) {
            width = targetMin;
            height = Math.round(targetMin / ratio);
        } else {
            height = targetMin;
            width = Math.round(targetMin * ratio);
        }
        element.style.width = `${width}px`;
        element.style.height = `${height}px`;
    } else {
        element.style.width = '';
        element.style.height = '';
    }
}

initializeSocket(SERVER_URL);
