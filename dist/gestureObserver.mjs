function findSet(set, callback) {
    const arr = [...set];
    const lng = arr.length;
    for (let i = 0; i < lng; i++) {
        if (callback(arr[i], i, set)) {
            return arr[i];
        }
    }
    return null;
}
export class GestureObserver {
    onGesture;
    observeGesture = new Set([
        'pan-x',
        'pan-y',
        'pinch-zoom',
        'double-tab',
    ]);
    observePointer = new Set(['mouse', 'touch', 'pen']);
    threshold = 4 * devicePixelRatio;
    pointerList = new Map();
    pointerInfoList = new Map();
    observeElements = new Set();
    inited = false;
    isTab = false;
    isEnd = true;
    primaryType = null;
    onGeustreMode = null;
    startPointX = 0;
    startPointY = 0;
    thresholdMinX = this.startPointX - this.threshold;
    thresholdMaxX = this.startPointX + this.threshold;
    thresholdMinY = this.startPointY - this.threshold;
    thresholdMaxY = this.startPointY + this.threshold;
    direction = 0;
    pointerHandler = (e, path) => {
        const { pointerId, pointerType, target, offsetX, offsetY } = e;
        const observeElement = path.find((item) => this.observeElements.has(item));
        return {
            pointerId,
            pointerType: pointerType,
            observeElement,
            target,
            offsetX,
            offsetY,
        };
    };
    pointerDownHandler = (e) => {
        const path = e.composedPath();
        requestAnimationFrame(() => {
            const { pointerId, pointerType, observeElement, target, offsetX, offsetY, } = this.pointerHandler(e, path);
            if (observeElement !== undefined &&
                (this.primaryType === e.pointerType ||
                    this.primaryType === null)) {
                if (e.isPrimary === true) {
                    this.primaryType = pointerType;
                }
                this.isTab = true;
                this.isEnd = false;
                this.pointerList.set(pointerId, e);
                const { x, y } = this.findActualPoint(observeElement, target, offsetX, offsetY);
                this.pointerInfoList.set(pointerId, { pointerType, x, y });
                this.startPointX = x;
                this.startPointY = y;
                this.setThresholdValue();
            }
        });
    };
    pointerMoveHandler = (e) => {
        const path = e.composedPath();
        requestAnimationFrame(() => {
            const { pointerId, pointerType, observeElement, target, offsetX, offsetY, } = this.pointerHandler(e, path);
            if (this.isTab === true && this.primaryType === e.pointerType) {
                this.pointerList.set(pointerId, e);
                const { x, y } = this.findActualPoint(observeElement, target, offsetX, offsetY);
                this.pointerInfoList.set(pointerId, { pointerType, x, y });
                if ((this.onGeustreMode === null ||
                    this.onGeustreMode === 'pan-x') &&
                    (this.thresholdMinX > x || this.thresholdMaxX < x) &&
                    this.pointerList.size === 1) {
                    this.onGeustreMode = 'pan-x';
                }
                if ((this.onGeustreMode === null ||
                    this.onGeustreMode === 'pan-y') &&
                    (this.thresholdMinY > y || this.thresholdMaxY < y) &&
                    this.pointerList.size === 1) {
                    this.onGeustreMode = 'pan-y';
                }
                if ((this.onGeustreMode === null ||
                    this.onGeustreMode === 'pinch-zoom') &&
                    this.pointerList.size > 1) {
                    this.onGeustreMode = 'pinch-zoom';
                }
                if (this.onGeustreMode !== null) {
                    this.onGesture({
                        gesture: this.onGeustreMode,
                        primaryType: this.primaryType,
                        point: this.getPoint(),
                        isTab: this.isTab,
                        isEnd: this.isEnd,
                        isIn: observeElement !== undefined,
                        pointer: [...this.pointerInfoList.values()],
                        observeElement,
                        path,
                    }, e, this);
                }
            }
        });
    };
    pointerUpHandler = (e) => {
        const path = e.composedPath();
        requestAnimationFrame(() => {
            const { pointerId, pointerType, observeElement, target, offsetX, offsetY, } = this.pointerHandler(e, path);
            this.pointerList.delete(pointerId);
            this.pointerInfoList.delete(pointerId);
            if ((this.onGeustreMode !== 'pinch-zoom' &&
                this.pointerList.size < 1) ||
                (this.onGeustreMode === 'pinch-zoom' &&
                    this.pointerList.size < 2)) {
                this.isTab = false;
                this.isEnd = true;
                if (this.onGeustreMode !== null) {
                    this.onGesture({
                        gesture: this.onGeustreMode,
                        primaryType: this.primaryType,
                        point: this.getPoint(),
                        isTab: this.isTab,
                        isEnd: this.isEnd,
                        isIn: observeElement !== undefined,
                        pointer: [...this.pointerInfoList.values()],
                        observeElement,
                        path,
                    }, e, this);
                }
                this.primaryType = null;
                this.startPointX = 0;
                this.startPointY = 0;
                this.setThresholdValue();
                this.onGeustreMode = null;
            }
        });
    };
    wheelHandler = (e) => {
        e.preventDefault();
        const path = e.composedPath();
        requestAnimationFrame(() => {
            const { deltaY, target, offsetX, offsetY } = e;
            const observeElement = path.find((item) => this.observeElements.has(item));
            if (observeElement === undefined)
                return;
        });
    };
    findActualPoint(observeElement, target, offsetX, offsetY) {
        let nowElement = target;
        let value = { x: offsetX, y: offsetY };
        while (nowElement !== observeElement) {
            if (nowElement.parentElement === null)
                break;
            value.x += nowElement.offsetLeft;
            value.y += nowElement.offsetTop;
            nowElement = nowElement.parentElement;
        }
        return value;
    }
    getPoint() {
        if (this.pointerInfoList.size > 0) {
            const pointerList = this.pointerList;
            const pointerInfoList = this.pointerInfoList;
            switch (this.onGeustreMode) {
                case 'pan-x':
                case 'pan-y':
                    const { x, y } = [...pointerInfoList.values()][0];
                    return { x, y };
                    break;
                case 'pinch-zoom':
                    const iterator = pointerList.values();
                    const touchA = iterator.next().value;
                    const touchB = iterator.next().value;
                    break;
            }
        }
        return { x: 0, y: 0 };
    }
    setThresholdValue() {
        this.thresholdMinX = this.startPointX - this.threshold;
        this.thresholdMaxX = this.startPointX + this.threshold;
        this.thresholdMinY = this.startPointY - this.threshold;
        this.thresholdMaxY = this.startPointY + this.threshold;
    }
    constructor(onGesture, option = {}) {
        const { observeGesture, observePointer, threshold } = option;
        this.onGesture = onGesture;
        if (observeGesture !== undefined)
            this.observeGesture = new Set(observeGesture);
        if (observePointer !== undefined)
            this.observePointer = new Set(observePointer);
        if (threshold !== undefined)
            this.threshold = threshold;
    }
    init() {
        globalThis.addEventListener('pointerdown', this.pointerDownHandler, {
            passive: false,
        });
        globalThis.addEventListener('pointermove', this.pointerMoveHandler, {
            passive: false,
        });
        globalThis.addEventListener('pointerup', this.pointerUpHandler, {
            passive: false,
        });
        globalThis.addEventListener('pointercancel', this.pointerUpHandler, {
            passive: false,
        });
        this.inited = true;
    }
    observe(element) {
        if (this.inited === false) {
            this.init();
        }
        this.observeElements.add(element);
    }
    unobserve(element) {
        this.observeElements.delete(element);
        if (this.observeElements.size === 0) {
            this.disconnect();
        }
    }
    disconnect() {
        this.observeElements.clear();
        globalThis.removeEventListener('pointerdown', this.pointerDownHandler);
        globalThis.removeEventListener('wheel', this.wheelHandler);
        this.inited = false;
    }
}
