/*
 * Copyright (C) 2026 LiveChat by Nevylish
 *
 * The whole overlay is laid out inside a fixed 1920×1080 stage.
 * We render once at that reference size, then apply a single uniform
 * transform (scale + centering translate) so the result is a pixel-exact
 * zoom of the 1080p design, identical proportions on 720p / 1440p / 4K.
 */

const REF_WIDTH = 1920;
const REF_HEIGHT = 1080;

function getOverlayScale() {
    return Math.min(window.innerWidth / REF_WIDTH, window.innerHeight / REF_HEIGHT);
}

function updateOverlayScale() {
    const scale = getOverlayScale();
    const offsetX = (window.innerWidth - REF_WIDTH * scale) / 2;
    const offsetY = (window.innerHeight - REF_HEIGHT * scale) / 2;

    const root = document.documentElement.style;
    root.setProperty('--overlay-scale', String(scale));
    root.setProperty('--overlay-offset-x', `${offsetX}px`);
    root.setProperty('--overlay-offset-y', `${offsetY}px`);
}

window.addEventListener('resize', updateOverlayScale);
updateOverlayScale();
