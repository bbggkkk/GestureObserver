import { GestureObserver, OnGestureParameter } from './gestureObserver.mjs';

const wrap = document.getElementById('wrap')!;
const box = document.getElementById('box')!;

const span = document.querySelector('#touch')! as HTMLElement;
const spanA = document.querySelector('.touchA')! as HTMLElement;
const spanB = document.querySelector('.touchB')! as HTMLElement;

const gestureObserver = new GestureObserver(
    (option) => {
        const { gesture, point, isEnd, startTarget, pointer: points } = option;
        const { x, y } = point;
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

        span.style.left = `${x}px`;
        span.style.top = `${y}px`;

        if (points[0] !== undefined) {
            spanA.style.left = `${points[0].x}px`;
            spanA.style.top = `${points[0].y}px`;
        }

        if (points[1] !== undefined) {
            spanB.style.left = `${points[1].x}px`;
            spanB.style.top = `${points[1].y}px`;
        }
    },
    {
        observeGesture: ['drag', 'pinch-zoom'],
    }
);
gestureObserver.observe(wrap);

function dragHandler(option: OnGestureParameter) {
    const { point, isEnd } = option;
    const { x, y, pointXStart, pointYStart } = point;
    const mx = (
        (x || 0) -
        (pointXStart || 0) +
        (Number(box.getAttribute('data-x')) || 0)
    ).toFixed(3);
    const my = (
        (y || 0) -
        (pointYStart || 0) +
        (Number(box.getAttribute('data-y')) || 0)
    ).toFixed(3);
    if (isEnd) {
        box.setAttribute('data-x', mx);
        box.setAttribute('data-y', my);
    } else {
        box.style.transform = `translate(${mx}px, ${my}px) scale(${
            box.getAttribute('data-scale') || 1
        })`;
    }
}
function pinchZoomHandler(option: OnGestureParameter) {
    const { point, pointerRaw } = option;
    const { pinchMovement } = point;
    if (pinchMovement === null) return;

    if (pointerRaw.every((item) => item.target === box)) {
        const scale = Math.max(
            0.5,
            (Number(box.getAttribute('data-scale')) || 1) + pinchMovement / 120
        );
        box.setAttribute('data-scale', scale.toFixed(3));
        dragHandler(option);
    }
}
