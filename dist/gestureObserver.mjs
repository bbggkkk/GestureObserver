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
    lastPoint = {
        x: null,
        y: null,
        pinchLevel: null,
        pinchLength: null,
        startPinchLevel: null,
        rotate: null,
        rotateAbsolute: null,
        startRotate: null,
    };
    primaryType = null;
    onGeustreMode = null;
    pinchLevel = null;
    startPointX = 0;
    startPointY = 0;
    startPinchLevel = null;
    startRotate = null;
    thresholdMinX = this.startPointX - this.threshold;
    thresholdMaxX = this.startPointX + this.threshold;
    thresholdMinY = this.startPointY - this.threshold;
    thresholdMaxY = this.startPointY + this.threshold;
    direction = 0;
    pointerHandler = (e, path) => {
        const { pointerId, pointerType, target, offsetX, offsetY, clientX, clientY, } = e;
        const observeElement = path.find((item) => this.observeElements.has(item));
        return {
            pointerId,
            pointerType: pointerType,
            observeElement,
            target,
            offsetX,
            offsetY,
            clientX,
            clientY,
        };
    };
    pointerDownHandler = (e) => {
        const path = e.composedPath();
        requestAnimationFrame(() => {
            const { pointerId, pointerType, observeElement, clientX, clientY } = this.pointerHandler(e, path);
            if (this.observePointer.has(pointerType) &&
                observeElement !== undefined &&
                (this.primaryType === e.pointerType ||
                    this.primaryType === null)) {
                if (e.isPrimary === true) {
                    this.primaryType = pointerType;
                }
                this.isTab = true;
                this.isEnd = false;
                this.pointerList.set(pointerId, e);
                const { x, y } = this.findActualPoint(pointerId, clientX, clientY, observeElement);
                this.pointerInfoList.set(pointerId, {
                    pointerType,
                    x,
                    y,
                    observeElement,
                });
                this.startPointX = x;
                this.startPointY = y;
                this.setThresholdValue();
            }
        });
    };
    pointerMoveHandler = (e) => {
        const path = e.composedPath();
        requestAnimationFrame(() => {
            const { pointerId, pointerType, observeElement, target, clientX, clientY, } = this.pointerHandler(e, path);
            if (this.observePointer.has(pointerType) &&
                this.isTab === true &&
                this.primaryType === e.pointerType) {
                this.pointerList.set(pointerId, e);
                const { x, y } = this.findActualPoint(pointerId, clientX, clientY);
                this.pointerInfoList.set(pointerId, {
                    pointerType,
                    x,
                    y,
                    observeElement: this.pointerInfoList.get(pointerId).observeElement,
                });
                if (this.observeGesture.has('pan-x') &&
                    (this.onGeustreMode === null ||
                        this.onGeustreMode === 'pan-x') &&
                    (this.thresholdMinX > x || this.thresholdMaxX < x) &&
                    this.pointerList.size === 1) {
                    this.onGeustreMode = 'pan-x';
                }
                if (this.observeGesture.has('pan-y') &&
                    (this.onGeustreMode === null ||
                        this.onGeustreMode === 'pan-y') &&
                    (this.thresholdMinY > y || this.thresholdMaxY < y) &&
                    this.pointerList.size === 1) {
                    this.onGeustreMode = 'pan-y';
                }
                if (this.observeGesture.has('pinch-zoom') &&
                    (this.onGeustreMode === null ||
                        this.onGeustreMode === 'pinch-zoom') &&
                    this.pointerList.size > 1) {
                    this.onGeustreMode = 'pinch-zoom';
                }
                if (this.onGeustreMode !== null) {
                    this.lastPoint = this.getPoint(observeElement);
                    this.onGesture({
                        gesture: this.onGeustreMode,
                        primaryType: this.primaryType,
                        point: this.lastPoint,
                        isTab: this.isTab,
                        isEnd: this.isEnd,
                        isIn: observeElement !== undefined,
                        pointer: [...this.pointerInfoList.values()],
                        observeElement,
                        target,
                        path,
                    }, e, this);
                }
            }
        });
    };
    pointerUpHandler = (e) => {
        const path = e.composedPath();
        requestAnimationFrame(() => {
            const { pointerId, observeElement, target } = this.pointerHandler(e, path);
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
                        point: this.lastPoint,
                        isTab: this.isTab,
                        isEnd: this.isEnd,
                        isIn: observeElement !== undefined,
                        pointer: [...this.pointerInfoList.values()],
                        observeElement,
                        target,
                        path,
                    }, e, this);
                }
                this.primaryType = null;
                this.startPointX = 0;
                this.startPointY = 0;
                this.startPinchLevel = null;
                this.startRotate = null;
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
    findActualPoint(pointerId, clientX, clientY, observeElement) {
        const targetElement = this.pointerInfoList.get(pointerId)?.observeElement ||
            observeElement;
        let value = { x: clientX, y: clientY };
        if (targetElement !== undefined) {
            const { x: nx, y: ny } = targetElement.getBoundingClientRect();
            value.x -= nx;
            value.y -= ny;
        }
        return value;
    }
    getPoint(observeElement) {
        if ((this.pointerInfoList.size > 0 &&
            this.onGeustreMode !== 'pinch-zoom') ||
            (this.pointerInfoList.size > 1 &&
                this.onGeustreMode === 'pinch-zoom')) {
            const pointerList = this.pointerList;
            const pointerInfoList = this.pointerInfoList;
            switch (this.onGeustreMode) {
                case 'pan-x':
                case 'pan-y': {
                    const { x, y } = [...pointerInfoList.values()][0];
                    return {
                        x,
                        y,
                        pinchLevel: null,
                        pinchLength: null,
                        startPinchLevel: null,
                        rotate: null,
                        rotateAbsolute: null,
                        startRotate: null,
                    };
                }
                case 'pinch-zoom': {
                    const iterator = pointerList.values();
                    const touchs = [
                        iterator.next().value,
                        iterator.next().value,
                    ];
                    const points = touchs.map((item) => this.findActualPoint(item.pointerId, item.clientX, item.clientY));
                    const minX = Math.min(points[0].x, points[1].x);
                    const maxX = Math.max(points[0].x, points[1].x);
                    const minY = Math.min(points[0].y, points[1].y);
                    const maxY = Math.max(points[0].y, points[1].y);
                    const xDiff = maxX - minX;
                    const yDiff = maxY - minY;
                    const pinchLength = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
                    const rotateAbsolute = (Math.atan2(points[0].y - points[1].y, points[0].x - points[1].x) *
                        180) /
                        Math.PI;
                    if (this.startPinchLevel === null) {
                        this.startPinchLevel = pinchLength;
                    }
                    if (this.startRotate === null) {
                        this.startRotate = rotateAbsolute;
                    }
                    const pinchLevel = pinchLength - this.startPinchLevel;
                    const rotate = rotateAbsolute - this.startRotate;
                    const { x, y } = {
                        x: minX + xDiff / 2,
                        y: minY + yDiff / 2,
                    };
                    const span = document.querySelector('#touch');
                    const spanA = document.querySelector('.touchA');
                    const spanB = document.querySelector('.touchB');
                    span.style.left = `${x}px`;
                    span.style.top = `${y}px`;
                    spanA.style.left = `${points[0].x}px`;
                    spanA.style.top = `${points[0].y}px`;
                    spanB.style.left = `${points[1].x}px`;
                    spanB.style.top = `${points[1].y}px`;
                    return {
                        x,
                        y,
                        pinchLevel,
                        pinchLength,
                        startPinchLevel: this.startPinchLevel,
                        rotate: rotate,
                        rotateAbsolute,
                        startRotate: this.startRotate,
                    };
                }
            }
        }
        return {
            x: null,
            y: null,
            pinchLevel: null,
            pinchLength: null,
            startPinchLevel: null,
            rotate: null,
            rotateAbsolute: null,
            startRotate: null,
        };
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
