import { GestureObserver } from './gestureObserver.mjs';
const wrap = document.getElementById('wrap');
const box = document.getElementById('box');
const gestureObserver = new GestureObserver((option) => {
    const { gesture, point, isEnd } = option;
    switch (gesture) {
        case 'drag':
            dragHandler(option);
            break;
        case 'pinch-zoom':
            pinchZoomHandler(option);
            break;
    }
}, {
    observeGesture: ['drag', 'pinch-zoom'],
});
gestureObserver.observe(wrap);
function dragHandler(option) {
    const { point, isEnd } = option;
    const { x, y, pointXStart, pointYStart } = point;
    console.log(pointXStart);
    const mx = ((x || 0) -
        (pointXStart || 0) +
        (Number(box.getAttribute('data-x')) || 0)).toFixed(3);
    const my = ((y || 0) -
        (pointYStart || 0) +
        (Number(box.getAttribute('data-y')) || 0)).toFixed(3);
    if (isEnd) {
        box.setAttribute('data-x', mx);
        box.setAttribute('data-y', my);
    }
    else {
        box.style.transform = `translate(${mx}px, ${my}px)`;
    }
}
function pinchZoomHandler(option) { }
