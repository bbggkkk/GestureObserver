import { GestureObserver } from './gestureObserver.mjs';
const main = document.querySelector('section');
const info = document.querySelector('pre');
const grp = document.querySelector('article');
const item = document.createElement('span');
item.style.backgroundColor = 'gray';
item.style.height = '0%';
item.style.flex = '1';
const LNG = 200;
const list = new Array(LNG)
    .fill(null)
    .map((nu) => item.cloneNode());
list.forEach((item) => {
    grp.appendChild(item);
});
const diffList = [];
const pointer = new GestureObserver((option, e, object) => {
    const { point, pointer, ...other } = option;
    const text = `${Object.keys(other)
        .reduce((acc, item) => {
        const text = `${item} : <span style="color:${typeof other[item] === 'boolean' ? 'darkorange' : 'teal'}; font-weight:bold;">${other[item]}</span>`;
        acc.push(text);
        return acc;
    }, [])
        .join('\n')}\npoint : ${jsonBeutify(arrayBeutify(JSON.stringify(point)))}\npointer : ${arrayBeutify(JSON.stringify(pointer))}`;
    info.innerHTML = text;
    diffList.push(point.pinchLevel);
    if (diffList.length > LNG) {
        diffList.shift();
    }
    if (other.gesture === 'pinch-zoom') {
        console.log(point.startPinchLevel);
        diffList.forEach((item, idx, arr) => {
            const level = (((item + point.startPinchLevel) / point.startPinchLevel) *
                50) /
                1.5;
            list[idx].style.height = `${level}%`;
        });
    }
});
pointer.observe(main);
console.log(pointer);
function arrayBeutify(string) {
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
function jsonBeutify(string) {
    let space = '';
    return string.replace(/[{,}:]/g, function (match) {
        let rt = '';
        switch (match) {
            case '{':
                space += '    ';
                rt = match + '\n' + space;
                break;
            case ',':
                rt = match + '\n' + space;
                break;
            case '}':
                space = space.substr(0, space.length - 4);
                rt = '\n' + space + match;
                break;
            case ':':
                rt = ' ' + match + ' ';
                break;
        }
        return rt;
    });
}
