// import Canvas from './canvas.mjs';

// const canvas = document.querySelector('canvas')!;
// const canvasObject = new Canvas(canvas);

// console.log(canvasObject);

// import { PointerEventSystem } from './canvas.mjs';
// const canvas = document.querySelector('canvas')!;
// const pointer = new PointerEventSystem(canvas);
// console.log(pointer);

import { GestureObserver } from './gestureObserver.mjs';
const main = document.querySelector('section')!;

const info = document.querySelector('pre')! as HTMLElement;

const grp = document.querySelector('article')! as HTMLElement;
const item = document.createElement('span');
item.style.backgroundColor = 'gray';
item.style.height = '0%';
item.style.flex = '1';
const LNG = 100;
const list: HTMLElement[] = new Array(LNG)
    .fill(null)
    .map((nu) => item.cloneNode() as HTMLElement);
list.forEach((item) => {
    grp.appendChild(item);
});
const diffList: number[] = [];

const pointer = new GestureObserver((option, e, object) => {
    const { point, pointer, ...other }: any = option;
    const text = `${Object.keys(other)
        .reduce((acc: string[], item) => {
            const text = `${item} : <span style="color:${
                typeof other[item] === 'boolean' ? 'darkorange' : 'teal'
            }; font-weight:bold;">${other[item]}</span>`;
            acc.push(text);
            return acc;
        }, [])
        .join('\n')}\npoint : ${jsonBeutify(JSON.stringify(point)).replace(
        '    ',
        ''
    )}\npointer : ${jsonBeutify(JSON.stringify(pointer))}`;
    info.innerHTML = text;

    diffList.push(point.xDiff);
    if (diffList.length > LNG) {
        diffList.shift();
    }

    if (other.gesture === 'pinch-zoom') {
        console.log(diffList.map((item) => item));
        diffList.forEach((item, idx, arr) => {
            const level = item / 4;
            list[idx].style.height = `${level}%`;
        });
    }
});
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
