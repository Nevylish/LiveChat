const SERVER_URL =
    window.location.hostname === 'localhost' ? 'http://localhost:3000' : `https://${window.location.hostname}`;

const CONFIG = {
    RECONNECT_ATTEMPTS: 60 * 60 * 1000 /* 1 hour */,
    RECONNECT_DELAY: 30 * 1000 /* 30 seconds */,
    DISPLAY_DURATION: 5 * 1000 /* 5 seconds */,
    FADE_DURATION: 500 /* 500 milliseconds */,
    SUPPORTED_VIDEO_FORMATS: /\.(mp4|webm|mkv|mov)$/i,
    SUPPORTED_AUDIO_FORMATS: /\.(mp3|wav|ogg)$/i,
};

const elements = {
    contentContainer: document.getElementById('content-container'),
    connectionStatus: document.getElementById('connection-status'),
};

let socket = null;
let currentContent = null;
let currentTimeout = null;
let contentQueue = [];
let isProcessingQueue = false;
let statusTimeout = null;
let isDisconnected = false;

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
}

function handleConnect() {
    updateConnectionStatus(true);

    const username = new URLSearchParams(window.location.search).get('username');
    const guildId = new URLSearchParams(window.location.search).get('guildId');

    if (!username) {
        updateConnectionStatus(false, 'Erreur de configuration: ?username param missing');
        return;
    }

    if (!guildId) {
        updateConnectionStatus(false, 'Erreur de configuration: ?guildId param missing');
        return;
    }

    socket.emit('register', { username, guildId });
}

function handleDisconnect() {
    updateConnectionStatus(false);
}

function handleConnectError(error) {
    console.error('Erreur de connexion\n', error);
    updateConnectionStatus(false, 'Serveur injoignable');
}

function handleBroadcast({ content, from, fullscreen }) {
    console.log('Nouveau livechat reçu:', content, 'de:', from.username);

    contentQueue.push({ content, from, fullscreen });

    if (!isProcessingQueue) {
        processNextContent();
    }
}

function processNextContent() {
    if (contentQueue.length === 0) {
        isProcessingQueue = false;
        const avatarElement = document.querySelector('.user-avatar');
        if (avatarElement) {
            avatarElement.classList.remove('fade-in');
            avatarElement.classList.add('fade-out');
            setTimeout(() => {
                avatarElement.style.display = 'none';
                avatarElement.innerHTML = '';
            }, CONFIG.FADE_DURATION);
        }
        return;
    }

    isProcessingQueue = true;
    const { content, from, fullscreen } = contentQueue.shift();

    setTimeout(() => {
        handleAvatar(from, fullscreen);

        cleanupCurrentContent(() => {
            const element = createContentElement(content, from, fullscreen);
            if (element) {
                displayContent(element, fullscreen);
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
        currentContent.classList.add('fade-out');
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

function createContentElement(content, from, fullscreen) {
    try {
        const url = new URL(content);
        const filename = url.pathname.split('/').pop() || '';
        const isVideo = CONFIG.SUPPORTED_VIDEO_FORMATS.test(filename);
        const isAudio = CONFIG.SUPPORTED_AUDIO_FORMATS.test(filename);

        const element = document.createElement(isVideo ? 'video' : isAudio ? 'audio' : 'img');
        element.src = content;

        if (isVideo || isAudio) {
            element.controls = true;
            element.autoplay = true;
            element.muted = false;
            element.playsInline = true;

            element.onerror = handleMediaError;
            element.onloadeddata = () => {
                void element.offsetWidth;
                element.classList.add('fade-in');
                element.play().catch(console.error);
            };
            element.addEventListener('ended', () => {
                element.classList.add('fade-out');
                const avatarElement = document.querySelector('.user-avatar');
                if (avatarElement) {
                    avatarElement.classList.add('fade-out');
                }
                setTimeout(() => {
                    removeContent(element, () => {
                        processNextContent();
                    });
                }, 100);
            });
        } else {
            void element.offsetWidth;
            element.classList.add('fade-in');

            currentTimeout = setTimeout(() => {
                element.classList.add('fade-out');
                const avatarElement = document.querySelector('.user-avatar');
                if (avatarElement) {
                    avatarElement.classList.add('fade-out');
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

function displayContent(element, fullscreen) {
    elements.contentContainer.appendChild(element);
    currentContent = element;
    elements.contentContainer.style.display = 'block';
    if (fullscreen) {
        elements.contentContainer.classList.add('fullscreen');
    } else {
        elements.contentContainer.classList.remove('fullscreen');
    }
}

function removeContent(element, callback) {
    if (elements.contentContainer.contains(element)) {
        elements.contentContainer.removeChild(element);
        elements.contentContainer.style.display = 'none';
        elements.contentContainer.classList.remove('fullscreen');
        currentContent = null;
    }

    if (callback) callback();
}

function handleAvatar(from, fullscreen) {
    let avatarElement = document.querySelector('.user-avatar');
    if (!avatarElement) {
        avatarElement = document.createElement('div');
        avatarElement.className = 'user-avatar';
        document.body.appendChild(avatarElement);
    }

    avatarElement.innerHTML = '';
    const avatarImg = document.createElement('img');
    avatarImg.src = from.avatarURL;
    avatarElement.appendChild(avatarImg);
    avatarElement.style.display = fullscreen ? 'none' : 'block';

    void avatarElement.offsetWidth;

    avatarElement.classList.remove('fade-in', 'fade-out');
    setTimeout(() => {
        avatarElement.classList.add('fade-in');
    }, 50);
}

function handleMediaError(error) {
    console.error('Erreur de chargement du média\n', error);
    processNextContent();
}

function updateConnectionStatus(connected, message = '') {
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
        ? 'Connecté au Live Chat'
        : `Déconnecté du Live Chat${message ? `: ${message}` : ''}`;

    void elements.connectionStatus.offsetWidth;

    elements.connectionStatus.classList.add('fade-in');

    statusTimeout = setTimeout(() => {
        elements.connectionStatus.classList.remove('fade-in');
        elements.connectionStatus.classList.add('fade-out');
        setTimeout(() => {
            elements.connectionStatus.style.display = 'none';
        }, 500);
    }, 5000);

    isDisconnected = !connected;
}

initializeSocket(SERVER_URL);
