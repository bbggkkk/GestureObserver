import { GestureObserver } from './gestureObserver.mjs';
const main = document.querySelector('main');
const info = document.querySelector('pre');
const pointer = new GestureObserver(({ gesture, pointer, isEnd }, e, object) => {
    const text = `gesture : <span style="color:teal; font-weight:bold;">${gesture}</span>\nisEnd   : <span style="color:darkorange; font-weight:bold;">${isEnd}</span>\npointer : ${jsonBeutify(JSON.stringify(pointer))}`;
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
        .replace(/"([x|y])"/g, '<span style="color:brown;">"$1"</span>')
        .replace(/(\d+)/g, '<span style="color:teal;">$1</span>');
}
