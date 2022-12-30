import { GestureObserver, } from './gestureObserver.mjs';
const wrap = document.getElementById('wrap');
const box = document.getElementById('box');
const span = document.createElement('span');
span.id = 'touch';
const spans = [];
const gestureObserver = new GestureObserver((option) => {
    const { gesture, point, isEnd, startTarget, pointer: points } = option;
    const { x, y, rotate } = point;
    if (startTarget === box) {
        switch (gesture) {
            case 'drag':
                dragHandler(option);
                break;
            case 'pinch-zoom':
                pinchZoomHandler(option);
                break;
        }
    }
    touchPoint(x, y, points, isEnd);
}, {
    observeGesture: ['drag', 'pinch-zoom'],
});
gestureObserver.observe(wrap);
function dragHandler(option) {
    const { point, isEnd } = option;
    const { x, y, pointXStart, pointYStart, pinchLevel, rotate } = point;
    const mx = ((x || 0) -
        (pointXStart || 0) +
        (Number(box.getAttribute('data-x')) || 0)).toFixed(3);
    const my = ((y || 0) -
        (pointYStart || 0) +
        (Number(box.getAttribute('data-y')) || 0)).toFixed(3);
    let transform = `translate(${mx}px, ${my}px)`;
    if (pinchLevel !== null) {
        let pinch = box.getAttribute('data-pinch');
        let size = box.getAttribute('data-size');
        if (pinch === null) {
            box.setAttribute('data-pinch', '1');
        }
        if (size === null) {
            const w = box.offsetWidth;
            const h = box.offsetHeight;
            const minSize = Math.min(w, h);
            box.setAttribute('data-size', String(minSize));
        }
        pinch = Number(box.getAttribute('data-pinch'));
        size = Number(box.getAttribute('data-size'));
        const scale = pinchLevel / size + pinch;
        if (isEnd) {
            const { width, height } = box.getBoundingClientRect();
            const size = Math.min(width, height);
            box.setAttribute('data-pinch', scale.toFixed(3));
            box.setAttribute('data-scale', size.toFixed(3));
        }
        transform += ` scale(${scale})`;
    }
    if (rotate !== null) {
        const scale = rotate + (Number(box.getAttribute('data-rotate')) || 0);
        if (isEnd) {
            box.setAttribute('data-rotate', scale.toFixed(3));
        }
        transform += ` rotate(${scale}deg)`;
    }
    if (isEnd) {
        box.setAttribute('data-x', mx);
        box.setAttribute('data-y', my);
    }
    box.style.transform = transform;
}
function pinchZoomHandler(option) {
    const { pointerRaw } = option;
    if (pointerRaw.every((item) => item.target === box)) {
        dragHandler(option);
    }
}
function touchPoint(x, y, points, isEnd) {
    wrap.appendChild(span);
    span.style.left = `${x}px`;
    span.style.top = `${y}px`;
    points.forEach(({ x, y }, idx) => {
        if (spans[idx] === undefined) {
            spans.push(document.createElement('span'));
            spans[idx].classList.add(`touch-${idx}`);
        }
        wrap.appendChild(spans[idx]);
        spans[idx].style.left = `${x}px`;
        spans[idx].style.top = `${y}px`;
    });
    if (isEnd) {
        span.remove();
        spans.forEach((item) => item.remove());
    }
}
