const photoInput = document.getElementById('photoInput');
const editCanvas = document.getElementById('editCanvas');
const editCtx = editCanvas.getContext('2d');
const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');
const previewButton = document.getElementById('previewButton');
const downloadButton = document.getElementById('downloadButton');
const resetButton = document.getElementById('resetButton');
const placeholder = document.getElementById('placeholder');
const magnifier = document.getElementById('magnifier');
const magnifierCanvas = document.getElementById('magnifierCanvas');
const magnifierCtx = magnifierCanvas.getContext('2d');

const handleRadius = 12;
const magnetRadiusSq = 26 * 26;

let image = null;
let sourceCanvas = null;
let sourceCtx = null;
let handles = [];
let activeHandleIndex = -1;
let editScale = 1;
let editOffset = { x: 0, y: 0 };
let pointerId = null;

photoInput.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => loadImage(reader.result);
    reader.readAsDataURL(file);
});

resetButton.addEventListener('click', () => {
    if (!image) return;
    resetHandles();
    renderEditCanvas();
});

previewButton.addEventListener('click', () => {
    if (!image) return;
    generatePreview();
});

downloadButton.addEventListener('click', () => {
    const url = previewCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    link.download = `id-card-${timestamp}.png`;
    link.click();
});

function loadImage(url) {
    const img = new Image();
    img.onload = () => {
        image = img;
        placeholder.hidden = true;
        setupSourceCanvas();
        computeEditScale();
        resetHandles();
        renderEditCanvas();
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        downloadButton.disabled = true;
    };
    img.onerror = () => alert('加载图片失败，请尝试重新选择');
    img.src = url;
}

function setupSourceCanvas() {
    sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = image.naturalWidth;
    sourceCanvas.height = image.naturalHeight;
    sourceCtx = sourceCanvas.getContext('2d');
    sourceCtx.drawImage(image, 0, 0);
}

function computeEditScale() {
    const padding = 32;
    const availableWidth = editCanvas.width - padding;
    const availableHeight = editCanvas.height - padding;
    const scale = Math.min(availableWidth / image.naturalWidth, availableHeight / image.naturalHeight);
    editScale = scale;
    editOffset = {
        x: (editCanvas.width - image.naturalWidth * scale) / 2,
        y: (editCanvas.height - image.naturalHeight * scale) / 2,
    };
}

function resizeWorkspace() {
    if (!image) return;
    computeEditScale();
    renderEditCanvas();
}

function resetHandles() {
    handles = [
        { x: 0, y: 0 },
        { x: image.naturalWidth, y: 0 },
        { x: image.naturalWidth, y: image.naturalHeight },
        { x: 0, y: image.naturalHeight },
    ];
}

function toDisplayCoordinates(point) {
    return {
        x: point.x * editScale + editOffset.x,
        y: point.y * editScale + editOffset.y,
    };
}

function toImageCoordinates(point) {
    return {
        x: Math.min(Math.max((point.x - editOffset.x) / editScale, 0), image.naturalWidth),
        y: Math.min(Math.max((point.y - editOffset.y) / editScale, 0), image.naturalHeight),
    };
}

function renderEditCanvas() {
    editCtx.clearRect(0, 0, editCanvas.width, editCanvas.height);
    if (!image) return;

    editCtx.drawImage(
        image,
        editOffset.x,
        editOffset.y,
        image.naturalWidth * editScale,
        image.naturalHeight * editScale
    );

    const displayPoints = handles.map(toDisplayCoordinates);

    editCtx.save();
    editCtx.lineWidth = 2;
    editCtx.strokeStyle = 'rgba(10, 89, 247, 0.9)';
    editCtx.fillStyle = 'rgba(10, 89, 247, 0.18)';

    editCtx.beginPath();
    editCtx.moveTo(displayPoints[0].x, displayPoints[0].y);
    for (let i = 1; i < displayPoints.length; i++) {
        editCtx.lineTo(displayPoints[i].x, displayPoints[i].y);
    }
    editCtx.closePath();
    editCtx.fill();
    editCtx.stroke();

    for (const point of displayPoints) {
        const gradient = editCtx.createRadialGradient(point.x, point.y, 2, point.x, point.y, handleRadius);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(1, '#0a59f7');
        editCtx.fillStyle = gradient;
        editCtx.beginPath();
        editCtx.arc(point.x, point.y, handleRadius, 0, Math.PI * 2);
        editCtx.fill();
        editCtx.strokeStyle = '#fff';
        editCtx.lineWidth = 2;
        editCtx.stroke();
    }
    editCtx.restore();
}

function getHandleIndexAtPosition(x, y) {
    const displayPoints = handles.map(toDisplayCoordinates);
    for (let i = 0; i < displayPoints.length; i++) {
        const point = displayPoints[i];
        const distSq = (point.x - x) ** 2 + (point.y - y) ** 2;
        if (distSq <= magnetRadiusSq) return i;
    }
    return -1;
}

function updateMagnifier(clientX, clientY, imagePoint) {
    if (!image) return;
    const rect = editCanvas.getBoundingClientRect();
    const canvasPoint = {
        x: ((clientX - rect.left) * editCanvas.width) / rect.width,
        y: ((clientY - rect.top) * editCanvas.height) / rect.height,
    };

    const magnifierSize = magnifierCanvas.width;
    const zoom = 3;
    const halfViewport = magnifierSize / (2 * zoom);
    const maxSourceX = Math.max(0, sourceCanvas.width - magnifierSize / zoom);
    const maxSourceY = Math.max(0, sourceCanvas.height - magnifierSize / zoom);
    const sourceX = clamp(imagePoint.x - halfViewport, 0, maxSourceX);
    const sourceY = clamp(imagePoint.y - halfViewport, 0, maxSourceY);

    magnifierCtx.clearRect(0, 0, magnifierSize, magnifierSize);
    magnifierCtx.drawImage(
        sourceCanvas,
        sourceX,
        sourceY,
        magnifierSize / zoom,
        magnifierSize / zoom,
        0,
        0,
        magnifierSize,
        magnifierSize
    );
    magnifierCtx.strokeStyle = 'rgba(10, 89, 247, 0.7)';
    magnifierCtx.lineWidth = 2;
    magnifierCtx.strokeRect(0, 0, magnifierSize, magnifierSize);

    magnifier.style.left = `${canvasPoint.x / editCanvas.width * 100}%`;
    magnifier.style.top = `${canvasPoint.y / editCanvas.height * 100}%`;
    magnifier.hidden = false;
}

function hideMagnifier() {
    magnifier.hidden = true;
}

editCanvas.addEventListener('pointerdown', (event) => {
    if (!image) return;
    pointerId = event.pointerId;
    const rect = editCanvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * editCanvas.width) / rect.width;
    const y = ((event.clientY - rect.top) * editCanvas.height) / rect.height;
    activeHandleIndex = getHandleIndexAtPosition(x, y);
    if (activeHandleIndex >= 0) {
        editCanvas.setPointerCapture(pointerId);
        const imgPoint = toImageCoordinates({ x, y });
        updateMagnifier(event.clientX, event.clientY, imgPoint);
    }
});

editCanvas.addEventListener('pointermove', (event) => {
    if (!image || activeHandleIndex < 0 || event.pointerId !== pointerId) return;
    const rect = editCanvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * editCanvas.width) / rect.width;
    const y = ((event.clientY - rect.top) * editCanvas.height) / rect.height;
    const imgPoint = toImageCoordinates({ x, y });
    handles[activeHandleIndex] = imgPoint;
    updateMagnifier(event.clientX, event.clientY, imgPoint);
    renderEditCanvas();
});

editCanvas.addEventListener('pointerup', endDrag);
editCanvas.addEventListener('pointercancel', endDrag);

function endDrag(event) {
    if (event.pointerId !== pointerId) return;
    if (editCanvas.hasPointerCapture(pointerId)) {
        editCanvas.releasePointerCapture(pointerId);
    }
    pointerId = null;
    activeHandleIndex = -1;
    hideMagnifier();
}

function generatePreview() {
    const top = distance(handles[0], handles[1]);
    const bottom = distance(handles[3], handles[2]);
    const left = distance(handles[0], handles[3]);
    const right = distance(handles[1], handles[2]);

    const targetWidth = Math.max(top, bottom, 1);
    const targetHeight = Math.max(left, right, 1);

    const aspect = targetWidth / targetHeight;
    const width = Math.min(1200, Math.max(480, Math.round(targetWidth)));
    const height = Math.max(1, Math.round(width / aspect));

    previewCanvas.width = width;
    previewCanvas.height = height;

    const sourceData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const destData = previewCtx.createImageData(width, height);
    const src = sourceData.data;
    const dst = destData.data;

    for (let y = 0; y < height; y++) {
        const v = height === 1 ? 0 : y / (height - 1);
        for (let x = 0; x < width; x++) {
            const u = width === 1 ? 0 : x / (width - 1);
            const point = bilinearInterpolate(handles, u, v);
            const color = sampleBilinear(src, sourceCanvas.width, sourceCanvas.height, point.x, point.y);
            const index = (y * width + x) * 4;
            dst[index] = color[0];
            dst[index + 1] = color[1];
            dst[index + 2] = color[2];
            dst[index + 3] = color[3];
        }
    }

    previewCtx.putImageData(destData, 0, 0);
    downloadButton.disabled = false;
}

function bilinearInterpolate(points, u, v) {
    const [tl, tr, br, bl] = points;
    const top = lerpPoint(tl, tr, u);
    const bottom = lerpPoint(bl, br, u);
    return lerpPoint(top, bottom, v);
}

function lerpPoint(a, b, t) {
    return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
    };
}

function sampleBilinear(data, width, height, x, y) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, width - 1);
    const y1 = Math.min(y0 + 1, height - 1);

    const dx = x - x0;
    const dy = y - y0;

    const c00 = getPixel(data, width, x0, y0);
    const c10 = getPixel(data, width, x1, y0);
    const c01 = getPixel(data, width, x0, y1);
    const c11 = getPixel(data, width, x1, y1);

    const r = bilerp(c00[0], c10[0], c01[0], c11[0], dx, dy);
    const g = bilerp(c00[1], c10[1], c01[1], c11[1], dx, dy);
    const b = bilerp(c00[2], c10[2], c01[2], c11[2], dx, dy);
    const a = bilerp(c00[3], c10[3], c01[3], c11[3], dx, dy);

    return [r, g, b, a];
}

function bilerp(c00, c10, c01, c11, dx, dy) {
    const top = c00 * (1 - dx) + c10 * dx;
    const bottom = c01 * (1 - dx) + c11 * dx;
    return Math.round(top * (1 - dy) + bottom * dy);
}

function getPixel(data, width, x, y) {
    const index = (y * width + x) * 4;
    return [data[index], data[index + 1], data[index + 2], data[index + 3]];
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// 允许拖拽文件到画布
editCanvas.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
});

editCanvas.addEventListener('drop', (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => loadImage(reader.result);
        reader.readAsDataURL(file);
    }
});

window.addEventListener('resize', () => {
    window.requestAnimationFrame(resizeWorkspace);
});
