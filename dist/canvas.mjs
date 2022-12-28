export class PointerEventSystem {
    _element;
    _pointerEvent;
    constructor(element) {
        this._element = element;
        this._pointerEvent = null;
        this._init();
    }
    _init() {
        const element = this._element;
        element.addEventListener('pointerdown', this._pointerEventHandler.bind(this));
        element.addEventListener('pointermove', this._pointerEventHandler.bind(this));
    }
    _pointerEventHandler(e) {
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
    _mouseEventHandler(e) { }
    _touchEventHandler(e) {
        console.log(e);
    }
    _penEventHandler(e) { }
}
export default class Canvas extends PointerEventSystem {
    constructor(canvas) {
        super(canvas);
    }
    get canvas() {
        return this._element;
    }
}
