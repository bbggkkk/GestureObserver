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
const DEFAULT_LAST_POINT = {
    x: null,
    y: null,
    pointXStart: null,
    pointYStart: null,
    movementX: null,
    movementY: null,
    distanceX: null,
    distanceY: null,
    travelX: null,
    travelY: null,
    travel: null,
    tiltX: null,
    tiltY: null,
    altKey: false,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
    pinchLevel: null,
    pinchLength: null,
    pinchLevelStart: null,
    pinchMovement: null,
    rotate: null,
    rotateAbsolute: null,
    rotateStart: null,
    rotateMovement: null,
};
export class GestureObserver {
    onGesture;
    observeGesture = new Set(['drag', 'pinch-zoom', 'double-tab']);
    observePointer = new Set(['mouse', 'touch', 'pen']);
    threshold = 4 * devicePixelRatio;
    pointerList = new Map();
    pointerInfoList = new Map();
    observeElements = new Set();
    inited = false;
    isTab = false;
    isEnd = true;
    lastPoint = DEFAULT_LAST_POINT;
    primaryType = null;
    onGeustreMode = null;
    pinchLevel = null;
    startPointX = 0;
    startPointY = 0;
    startTarget = null;
    pinchLevelStart = null;
    rotateStart = null;
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
            const { pointerId, pointerType, observeElement, clientX, clientY, target, } = this.pointerHandler(e, path);
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
                this.startTarget = target;
                this.lastPoint.travelX = null;
                this.lastPoint.travelY = null;
                this.lastPoint.travel = null;
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
                if ((this.thresholdMinX > x || this.thresholdMaxX < x) &&
                    this.pointerList.size === 1) {
                    if (this.observeGesture.has('pan-x') &&
                        (this.onGeustreMode === null ||
                            this.onGeustreMode === 'pan-x')) {
                        this.onGeustreMode = 'pan-x';
                    }
                    else if (this.observeGesture.has('drag') &&
                        (this.onGeustreMode === null ||
                            this.onGeustreMode === 'drag')) {
                        this.onGeustreMode = 'drag';
                    }
                }
                if ((this.thresholdMinY > y || this.thresholdMaxY < y) &&
                    this.pointerList.size === 1) {
                    if (this.observeGesture.has('pan-y') &&
                        (this.onGeustreMode === null ||
                            this.onGeustreMode === 'pan-y')) {
                        this.onGeustreMode = 'pan-y';
                    }
                    else if (this.observeGesture.has('drag') &&
                        (this.onGeustreMode === null ||
                            this.onGeustreMode === 'drag')) {
                        this.onGeustreMode = 'drag';
                    }
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
                        pointerRaw: [...this.pointerList.values()],
                        observeElement,
                        target,
                        startTarget: this.startTarget,
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
                        pointerRaw: [...this.pointerList.values()],
                        observeElement,
                        target,
                        startTarget: this.startTarget,
                        path,
                    }, e, this);
                }
                this.primaryType = null;
                this.startPointX = 0;
                this.startPointY = 0;
                this.startTarget = null;
                this.pinchLevelStart = null;
                this.rotateStart = null;
                this.lastPoint = DEFAULT_LAST_POINT;
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
                case 'drag':
                case 'pan-x':
                case 'pan-y': {
                    const { x, y } = [...pointerInfoList.values()][0];
                    if (this.lastPoint.pointXStart === null) {
                        this.lastPoint = Object.assign({}, this.lastPoint, {
                            pointXStart: x,
                            pointYStart: y,
                        });
                    }
                    const { tiltX, tiltY, altKey, ctrlKey, metaKey, shiftKey } = [...pointerList.values()][0];
                    const moveX = this.lastPoint.x === null ? 0 : x - this.lastPoint.x;
                    const moveY = this.lastPoint.y === null ? 0 : y - this.lastPoint.y;
                    const travelX = this.lastPoint.travelX === null
                        ? Math.abs(moveX)
                        : this.lastPoint.travelX + Math.abs(moveX);
                    const travelY = this.lastPoint.travelY === null
                        ? Math.abs(moveY)
                        : this.lastPoint.travelY + Math.abs(moveY);
                    return Object.assign({}, DEFAULT_LAST_POINT, {
                        x,
                        y,
                        pointXStart: this.lastPoint.pointXStart,
                        pointYStart: this.lastPoint.pointYStart,
                        movementX: moveX,
                        movementY: moveY,
                        distanceX: x - this.startPointX,
                        distanceY: y - this.startPointY,
                        travelX,
                        travelY,
                        travel: (this.lastPoint.travel || 0) +
                            Math.sqrt(Math.pow(moveX, 2) + Math.pow(moveY, 2)),
                        tiltX,
                        tiltY,
                        altKey,
                        ctrlKey,
                        metaKey,
                        shiftKey,
                    });
                }
                case 'pinch-zoom': {
                    const iterator = pointerList.values();
                    const touchs = [
                        iterator.next().value,
                        iterator.next().value,
                    ];
                    const points = touchs.map((item) => this.findActualPoint(item.pointerId, item.clientX, item.clientY));
                    const { altKey, ctrlKey, metaKey, shiftKey } = touchs[0];
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
                    if (this.pinchLevelStart === null) {
                        this.pinchLevelStart = pinchLength;
                    }
                    if (this.rotateStart === null) {
                        this.rotateStart = rotateAbsolute;
                    }
                    const pinchLevel = pinchLength - this.pinchLevelStart;
                    const rotate = rotateAbsolute - this.rotateStart;
                    const { x, y } = {
                        x: minX + xDiff / 2,
                        y: minY + yDiff / 2,
                    };
                    if (this.lastPoint.pointXStart === null) {
                        this.lastPoint = Object.assign({}, this.lastPoint, {
                            pointXStart: x,
                            pointYStart: y,
                        });
                    }
                    const moveX = this.lastPoint.x === null ? 0 : x - this.lastPoint.x;
                    const moveY = this.lastPoint.y === null ? 0 : y - this.lastPoint.y;
                    const travelX = this.lastPoint.travelX === null
                        ? Math.abs(moveX)
                        : this.lastPoint.travelX + Math.abs(moveX);
                    const travelY = this.lastPoint.travelY === null
                        ? Math.abs(moveY)
                        : this.lastPoint.travelY + Math.abs(moveY);
                    return Object.assign({}, DEFAULT_LAST_POINT, {
                        x,
                        y,
                        pointXStart: this.lastPoint.pointXStart,
                        pointYStart: this.lastPoint.pointYStart,
                        movementX: moveX,
                        movementY: moveY,
                        distanceX: x - this.startPointX,
                        distanceY: y - this.startPointY,
                        travelX,
                        travelY,
                        travel: (this.lastPoint.travel || 0) +
                            Math.sqrt(Math.pow(moveX, 2) + Math.pow(moveY, 2)),
                        altKey,
                        ctrlKey,
                        metaKey,
                        shiftKey,
                        pinchLevel,
                        pinchLength,
                        pinchLevelStart: this.pinchLevelStart,
                        pinchMovement: pinchLevel - (this.lastPoint.pinchLevel || 0),
                        rotate: rotate,
                        rotateAbsolute,
                        rotateStart: this.rotateStart,
                        rotateMovement: rotate - (this.lastPoint.rotate || 0),
                    });
                }
            }
        }
        return DEFAULT_LAST_POINT;
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
