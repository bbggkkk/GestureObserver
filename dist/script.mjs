import { GestureObserver } from './gestureObserver.mjs';
const main = document.querySelector('main');
const info = document.querySelector('pre');
const pointer = new GestureObserver((option, e, object) => {
    const { point, pointer, ...other } = option;
    const text = `${Object.keys(other)
        .reduce((acc, item) => {
        const text = `${item} : <span style="color:${typeof other[item] === 'boolean' ? 'darkorange' : 'teal'}; font-weight:bold;">${other[item]}</span>`;
        acc.push(text);
        return acc;
    }, [])
        .join('\n')}\npoint : ${jsonBeutify(JSON.stringify(point)).replace('    ', '')}\npointer : ${jsonBeutify(JSON.stringify(pointer))}`;
    info.innerHTML = text;
});
pointer.observe(main);
console.log(pointer);
function jsonBeutify(string) {
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
