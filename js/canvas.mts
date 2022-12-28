import PointerTypeObject from './pointer.mjs';

export class PointerEventSystem {
    _element: HTMLElement;
    _pointerEvent: PointerEvent | null;
    constructor(element: HTMLElement) {
        this._element = element;
        this._pointerEvent = null;
        this._init();
    }
    _init() {
        const element = this._element;
        element.addEventListener(
            'pointerdown',
            this._pointerEventHandler.bind(this)
        );
        element.addEventListener(
            'pointermove',
            this._pointerEventHandler.bind(this)
        );
        // element.addEventListener('pointerup', this._pointerEventHandler);
    }
    _pointerEventHandler(e: PointerEvent) {
        const { pointerType } = e;
        switch (pointerType) {
            case 'mouse':
                this._mouseEventHandler(e);
                break;
            case 'touch':
                this._touchEventHandler(e);
                break;
            case 'pen':
                this._penEventHandler(e);
                break;
        }
        this._pointerEvent = e;
    }
    _mouseEventHandler(e: PointerEvent) {}
    _touchEventHandler(e: PointerEvent) {
        console.log(e);
    }
    _penEventHandler(e: PointerEvent) {}
}

export default class Canvas extends PointerEventSystem {
    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
    }
    get canvas() {
        return this._element;
    }
}
