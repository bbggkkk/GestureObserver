// import Canvas from './canvas.mjs';

// const canvas = document.querySelector('canvas')!;
// const canvasObject = new Canvas(canvas);

// console.log(canvasObject);

// import { PointerEventSystem } from './canvas.mjs';
// const canvas = document.querySelector('canvas')!;
// const pointer = new PointerEventSystem(canvas);
// console.log(pointer);

import { GestureObserver } from './gestureObserver.mjs';
const main = document.querySelector('main')!;

const info = document.querySelector('pre')! as HTMLElement;

const pointer = new GestureObserver(
    ({ gesture, pointer, isEnd, isTab }, e, object) => {
        const text = `gesture : <span style="color:teal; font-weight:bold;">${gesture}</span>\nisEnd   : <span style="color:darkorange; font-weight:bold;">${isEnd}</span>\nisTab : <span style="color:darkorange; font-weight:bold;">${isTab}</span>\npointer : ${jsonBeutify(
            JSON.stringify(pointer)
        )}`;
        info.innerHTML = text;
    }
);
pointer.observe(main);
console.log(pointer);

function jsonBeutify(string: string) {
    return string
        .replace('[', '[\n')
        .replace(']', '\n]')
        .replace(/\}\,\{/g, (match) => {
            return '},\n{';
        })
        .replace(/\{/g, '    {')
        .replace(/([{,}])(.*?):/g, '$1<span style="color:brown;">$2</span>:')
        .replace(/:([^:]*?)([},])/g, ':<span style="color:teal;">$1</span>$2');
}
