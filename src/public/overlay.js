const SERVER_URL =
    window.location.hostname === 'localhost' ? 'http://localhost:3000' : `https://${window.location.hostname}`;

const CONFIG = {
    RECONNECT_ATTEMPTS: 240 /* 240 * 4 = 1 hour ? */,
    RECONNECT_DELAY: 15 * 1000 /* 15 seconds */,
    DISPLAY_DURATION: 7 * 1000 /* 7 seconds */,
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
    socket.on('updateConnectionStatus', updateConnectionStatus)
}

function handleConnect() {
    updateConnectionStatus(true);

    const username = new URLSearchParams(window.location.search).get('username');
    const guildId = new URLSearchParams(window.location.search).get('guildId');

    if (!username) {
        updateConnectionStatus(false, "Le paramètre ?username est vide, utilisez le site livechat.nevylish.fr pour obtenir votre URL.", 300000);
        return;
    }

    if (!guildId) {
        updateConnectionStatus(false, 'Le paramètre ?guildId est vide, utilisez le site livechat.nevylish.fr pour obtenir votre URL.', 300000);
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

function handleBroadcast({ content, from, fullscreen, text }) {
    console.log('Nouveau livechat reçu:', content, 'de:', from.username);

    contentQueue.push({ content, from, fullscreen, text });

    if (!isProcessingQueue) {
        processNextContent();
    }
}

function processNextContent() {
    if (contentQueue.length === 0) {
        isProcessingQueue = false;
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
    const { content, from, fullscreen, text } = contentQueue.shift();

    setTimeout(() => {
        handleUserInfos(from, fullscreen);

        cleanupCurrentContent(() => {
            const element = createContentElement(content, from, fullscreen, text);
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
        currentContent.classList.add('fade-out');
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

function createContentElement(content) {
    try {
        const url = new URL(content);
        const filename = url.pathname.split('/').pop() || '';

        const isYouTubeDirect =
            url.hostname.includes('googlevideo.com') ||
            url.hostname.includes('youtube.com') ||
            url.searchParams.has('range') ||
            url.searchParams.has('expire');

        const isVideo = CONFIG.SUPPORTED_VIDEO_FORMATS.test(filename) || isYouTubeDirect;
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
            void element.offsetWidth;
            element.classList.add('fade-in');

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
    elements.contentContainer.style.display = 'block';
    if (fullscreen) {
        elements.contentContainer.classList.add('fullscreen');
    } else {
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

    document.body.appendChild(textElement);

    void textElement.offsetWidth;
    textElement.classList.add('fade-in');
}

function removeContent(element, callback) {
    if (elements.contentContainer.contains(element)) {
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

function handleUserInfos(from) {
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
    usernameDiv.textContent = from.username;
    userInfoElement.appendChild(usernameDiv);

    userInfoElement.style.display = 'flex';

    void userInfoElement.offsetWidth;

    userInfoElement.classList.remove('fade-in', 'fade-out');
    setTimeout(() => {
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
        ? 'Connecté au LiveChat'
        : `Déconnecté du LiveChat${message ? `: ${message}` : ''}`;

    void elements.connectionStatus.offsetWidth;

    elements.connectionStatus.classList.add('fade-in');

    statusTimeout = setTimeout(() => {
        elements.connectionStatus.classList.remove('fade-in');
        elements.connectionStatus.classList.add('fade-out');
        setTimeout(() => {
            elements.connectionStatus.style.display = 'none';
        }, 500);
    }, timeout);

    isDisconnected = !connected;
}

initializeSocket(SERVER_URL);
