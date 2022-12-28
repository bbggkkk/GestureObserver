/**
 * 인식할 제스쳐를 제한합니다
 * @argument {string} pan-x 좌우 팬을 인식합니다.
 * @argument {string} pan-y 상하 팬을 인식합니다.
 * @argument {string} pinch-zoom 두 손가락으로 오므렸다 벌렸다 하는 제스쳐를 인식합니다.
 * @argument {string} double-tab 연속으로 포인팅 되는 제스쳐를 인식합니다.
 * */
type OnGestureMode = 'pan-x' | 'pan-y' | 'pinch-zoom' | 'double-tab' | null;
type ObserveGestureType = Exclude<OnGestureMode, null>;
type ObservePointerMode = 'mouse' | 'touch' | 'pen' | null;
type ObservePointerType = Exclude<ObservePointerMode, null>;
type PointType = {
    x: number | null;
    y: number | null;
    movementX: number | null;
    movementY: number | null;
    distanceX: number | null;
    distanceY: number | null;
    travelX: number | null;
    travelY: number | null;
    travel: number | null;
    tiltX: number | null;
    tiltY: number | null;
    pinchLevel: number | null;
    pinchLength: number | null;
    pinchLevelStart: number | null;
    rotate: number | null;
    rotateAbsolute: number | null;
    rotateStart: number | null;
};
interface OnGestureParameter {
    observeElement: HTMLElement;
    target: EventTarget | null;
    point: PointType;
    path: EventTarget[];
    isTab: boolean;
    isEnd: boolean;
    isIn: boolean;
    gesture: ObserveGestureType;
    pointer: {
        x: number;
        y: number;
        pointerType: ObservePointerType;
    }[];
    primaryType: ObservePointerMode;
}
type OnGestureType = (
    { observeElement }: OnGestureParameter,
    e: PointerEvent,
    object: GestureObserver
) => void;
/**
 * 제스쳐 옵션을 설정합니다
 * @argument {ObserveGestureType} observeGesture 인식할 제스쳐를 제한합니다.
 */
export interface GestureObserverOptionType {
    observeGesture?: ObserveGestureType[];
    observePointer?: ObservePointerType[];
    threshold?: number;
}

/**
 * 특정 엘리먼트에 대한 제스쳐를 추적하고 제공하는 객체를 생성합니다.
 */
// function reduceSet(
//     set: Set<any>,
//     callback: (acc: any, item: any, idx: number, set: Set<any>) => any,
//     defaultValue = [...set][0]
// ) {
//     const arr = [...set];
//     const lng = arr.length;
//     let recentValue = defaultValue;
//     const idx = arr[0] === recentValue ? 1 : 0;
//     for (let i = idx; i < lng; i++) {
//         recentValue = callback(defaultValue, arr[i], idx, set);
//     }
//     return recentValue;
// }
function findSet(
    set: Set<any>,
    callback: (item: any, idx: number, set: Set<any>) => any
) {
    const arr = [...set];
    const lng = arr.length;
    for (let i = 0; i < lng; i++) {
        if (callback(arr[i], i, set)) {
            return arr[i];
        }
    }
    return null;
}

const DEFAULT_LAST_POINT: PointType = {
    x: null,
    y: null,
    movementX: null,
    movementY: null,
    distanceX: null,
    distanceY: null,
    travelX: null,
    travelY: null,
    travel: null,
    tiltX: null,
    tiltY: null,
    pinchLevel: null,
    pinchLength: null,
    pinchLevelStart: null,
    rotate: null,
    rotateAbsolute: null,
    rotateStart: null,
};
export class GestureObserver {
    protected onGesture: OnGestureType;
    protected observeGesture = new Set([
        'pan-x',
        'pan-y',
        'pinch-zoom',
        'double-tab',
    ]);
    protected observePointer = new Set(['mouse', 'touch', 'pen']);
    protected threshold = 4 * devicePixelRatio;
    protected pointerList: Map<number, PointerEvent> = new Map();
    protected pointerInfoList: Map<
        number,
        {
            x: number;
            y: number;
            pointerType: ObservePointerType;
            observeElement: HTMLElement;
        }
    > = new Map();
    protected observeElements: Set<HTMLElement> = new Set();
    protected inited = false;

    protected isTab = false;
    protected isEnd = true;
    protected lastPoint: PointType = DEFAULT_LAST_POINT;
    protected primaryType: ObservePointerMode = null;
    protected onGeustreMode: OnGestureMode = null;
    protected pinchLevel: number | null = null;

    protected startPointX = 0;
    protected startPointY = 0;
    protected pinchLevelStart: number | null = null;
    protected rotateStart: number | null = null;

    protected thresholdMinX = this.startPointX - this.threshold;
    protected thresholdMaxX = this.startPointX + this.threshold;
    protected thresholdMinY = this.startPointY - this.threshold;
    protected thresholdMaxY = this.startPointY + this.threshold;

    protected direction = 0;

    protected pointerHandler = (e: PointerEvent, path: EventTarget[]) => {
        const {
            pointerId,
            pointerType,
            target,
            offsetX,
            offsetY,
            clientX,
            clientY,
        } = e;
        const observeElement = path.find((item) =>
            this.observeElements.has(item as HTMLElement)
        ) as HTMLElement;
        return {
            pointerId,
            pointerType: pointerType as ObservePointerType,
            observeElement,
            target,
            offsetX,
            offsetY,
            clientX,
            clientY,
        };
    };
    protected pointerDownHandler = (e: PointerEvent) => {
        const path = e.composedPath();
        requestAnimationFrame(() => {
            const { pointerId, pointerType, observeElement, clientX, clientY } =
                this.pointerHandler(e, path);
            if (
                this.observePointer.has(pointerType) &&
                observeElement !== undefined &&
                (this.primaryType === e.pointerType ||
                    this.primaryType === null)
            ) {
                if (e.isPrimary === true) {
                    this.primaryType = pointerType;
                }
                this.isTab = true;
                this.isEnd = false;
                this.pointerList.set(pointerId, e);
                const { x, y } = this.findActualPoint(
                    pointerId,
                    clientX,
                    clientY,
                    observeElement
                );
                this.pointerInfoList.set(pointerId, {
                    pointerType,
                    x,
                    y,
                    observeElement,
                });
                this.startPointX = x;
                this.startPointY = y;
                this.lastPoint.travelX = null;
                this.lastPoint.travelY = null;
                this.lastPoint.travel = null;
                this.setThresholdValue();
            }
        });
    };
    protected pointerMoveHandler = (e: PointerEvent) => {
        const path = e.composedPath();
        requestAnimationFrame(() => {
            const {
                pointerId,
                pointerType,
                observeElement,
                target,
                clientX,
                clientY,
            } = this.pointerHandler(e, path);
            if (
                this.observePointer.has(pointerType) &&
                this.isTab === true &&
                this.primaryType === e.pointerType
            ) {
                this.pointerList.set(pointerId, e);
                const { x, y } = this.findActualPoint(
                    pointerId,
                    clientX,
                    clientY
                );
                this.pointerInfoList.set(pointerId, {
                    pointerType,
                    x,
                    y,
                    observeElement:
                        this.pointerInfoList.get(pointerId)!.observeElement,
                });
                if (
                    this.observeGesture.has('pan-x') &&
                    (this.onGeustreMode === null ||
                        this.onGeustreMode === 'pan-x') &&
                    (this.thresholdMinX > x || this.thresholdMaxX < x) &&
                    this.pointerList.size === 1
                ) {
                    this.onGeustreMode = 'pan-x';
                }
                if (
                    this.observeGesture.has('pan-y') &&
                    (this.onGeustreMode === null ||
                        this.onGeustreMode === 'pan-y') &&
                    (this.thresholdMinY > y || this.thresholdMaxY < y) &&
                    this.pointerList.size === 1
                ) {
                    this.onGeustreMode = 'pan-y';
                }
                if (
                    this.observeGesture.has('pinch-zoom') &&
                    (this.onGeustreMode === null ||
                        this.onGeustreMode === 'pinch-zoom') &&
                    this.pointerList.size > 1
                ) {
                    this.onGeustreMode = 'pinch-zoom';
                }

                if (this.onGeustreMode !== null) {
                    this.lastPoint = this.getPoint(observeElement);
                    this.onGesture(
                        {
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
                        },
                        e,
                        this
                    );
                }
            }
        });
    };
    protected pointerUpHandler = (e: PointerEvent) => {
        const path = e.composedPath();
        requestAnimationFrame(() => {
            const { pointerId, observeElement, target } = this.pointerHandler(
                e,
                path
            );
            // if (observeElement === undefined) return;
            this.pointerList.delete(pointerId);
            this.pointerInfoList.delete(pointerId);

            if (
                (this.onGeustreMode !== 'pinch-zoom' &&
                    this.pointerList.size < 1) ||
                (this.onGeustreMode === 'pinch-zoom' &&
                    this.pointerList.size < 2)
            ) {
                this.isTab = false;
                this.isEnd = true;

                if (this.onGeustreMode !== null) {
                    this.onGesture(
                        {
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
                        },
                        e,
                        this
                    );
                }

                this.primaryType = null;
                this.startPointX = 0;
                this.startPointY = 0;
                this.pinchLevelStart = null;
                this.rotateStart = null;
                this.lastPoint = DEFAULT_LAST_POINT;
                this.setThresholdValue();
                this.onGeustreMode = null;
            }
        });
    };
    protected wheelHandler = (e: WheelEvent) => {
        e.preventDefault();
        const path = e.composedPath();
        requestAnimationFrame(() => {
            const { deltaY, target, offsetX, offsetY } = e;
            const observeElement = path.find((item) =>
                this.observeElements.has(item as HTMLElement)
            ) as HTMLElement;
            if (observeElement === undefined) return;
            // if (
            //     (this.onGeustreMode === null ||
            //         this.onGeustreMode === 'pinch-zoom') &&
            //     this.pointerList.size === 0
            // ) {
            //     this.onGeustreMode = 'pinch-zoom';
            // }
        });
    };
    protected findActualPoint(
        pointerId: number,
        clientX: number,
        clientY: number,
        observeElement?: HTMLElement
    ) {
        const targetElement =
            this.pointerInfoList.get(pointerId)?.observeElement ||
            observeElement;
        let value = { x: clientX, y: clientY };
        // console.log(targetElement);
        if (targetElement !== undefined) {
            // const { x: lx, y: ly } =
            //     document.documentElement.getBoundingClientRect();
            const { x: nx, y: ny } = targetElement.getBoundingClientRect();
            // console.log(nx, ny);
            value.x -= nx;
            value.y -= ny;
        }

        // let nowElement = target;
        // let value = { x: offsetX, y: offsetY };
        // if (observeElement !== undefined) {
        //     while (nowElement !== observeElement) {
        //         if (
        //             !nowElement.parentElement ||
        //             nowElement.parentElement === document.body
        //         ) {
        //             break;
        //         }
        //         value.x += nowElement.offsetLeft;
        //         value.y += nowElement.offsetTop;
        //         nowElement = nowElement.parentElement;
        //     }
        // } else {
        //     const targetElement =
        //         this.pointerInfoList.get(pointerId)?.observeElement;
        //     if (targetElement !== undefined) {
        //         nowElement = targetElement;
        //         let lastElement = targetElement;
        //         do {
        //             if (!nowElement.parentElement) {
        //                 break;
        //             }
        //             nowElement = nowElement.parentElement;
        //             const { x: lx, y: ly } =
        //                 lastElement.getBoundingClientRect();
        //             const { x: nx, y: ny } = nowElement.getBoundingClientRect();
        //             value.x -= lx - nx;
        //             value.y -= ly - ny;
        //             lastElement = nowElement;
        //         } while (nowElement !== target);

        //         // console.log(value);
        //     }
        // }
        return value;
    }
    protected getPoint(observeElement: HTMLElement) {
        if (
            (this.pointerInfoList.size > 0 &&
                this.onGeustreMode !== 'pinch-zoom') ||
            (this.pointerInfoList.size > 1 &&
                this.onGeustreMode === 'pinch-zoom')
        ) {
            const pointerList = this.pointerList;
            const pointerInfoList = this.pointerInfoList;
            switch (this.onGeustreMode) {
                case 'pan-x':
                case 'pan-y': {
                    const { x, y } = [...pointerInfoList.values()][0];
                    const { tiltX, tiltY } = [...pointerList.values()][0];
                    const moveX =
                        this.lastPoint.x === null ? 0 : x - this.lastPoint.x;
                    const moveY =
                        this.lastPoint.y === null ? 0 : y - this.lastPoint.y;
                    const travelX =
                        this.lastPoint.travelX === null
                            ? Math.abs(moveX)
                            : this.lastPoint.travelX + Math.abs(moveX);
                    const travelY =
                        this.lastPoint.travelY === null
                            ? Math.abs(moveY)
                            : this.lastPoint.travelY + Math.abs(moveY);
                    return Object.assign(DEFAULT_LAST_POINT, {
                        x,
                        y,
                        movementX: moveX,
                        movementY: moveY,
                        distanceX: x - this.startPointX,
                        distanceY: y - this.startPointY,
                        travelX,
                        travelY,
                        travel:
                            (this.lastPoint.travel || 0) +
                            Math.sqrt(Math.pow(moveX, 2) + Math.pow(moveY, 2)),
                        tiltX,
                        tiltY,
                    });
                }
                case 'pinch-zoom': {
                    const iterator = pointerList.values();
                    const touchs = [
                        iterator.next().value,
                        iterator.next().value,
                    ];
                    const points = touchs.map((item) =>
                        this.findActualPoint(
                            item.pointerId,
                            item.clientX,
                            item.clientY
                        )
                    );
                    const minX = Math.min(points[0].x, points[1].x);
                    const maxX = Math.max(points[0].x, points[1].x);
                    const minY = Math.min(points[0].y, points[1].y);
                    const maxY = Math.max(points[0].y, points[1].y);
                    const xDiff = maxX - minX;
                    const yDiff = maxY - minY;
                    const pinchLength = Math.sqrt(
                        Math.pow(xDiff, 2) + Math.pow(yDiff, 2)
                    );
                    const rotateAbsolute =
                        (Math.atan2(
                            points[0].y - points[1].y,
                            points[0].x - points[1].x
                        ) *
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
                    const span = document.querySelector(
                        '#touch'
                    )! as HTMLElement;
                    const spanA = document.querySelector(
                        '.touchA'
                    )! as HTMLElement;
                    const spanB = document.querySelector(
                        '.touchB'
                    )! as HTMLElement;
                    span.style.left = `${x}px`;
                    span.style.top = `${y}px`;

                    spanA.style.left = `${points[0].x}px`;
                    spanA.style.top = `${points[0].y}px`;
                    spanB.style.left = `${points[1].x}px`;
                    spanB.style.top = `${points[1].y}px`;

                    const moveX =
                        this.lastPoint.x === null ? 0 : x - this.lastPoint.x;
                    const moveY =
                        this.lastPoint.y === null ? 0 : y - this.lastPoint.y;
                    const travelX =
                        this.lastPoint.travelX === null
                            ? Math.abs(moveX)
                            : this.lastPoint.travelX + Math.abs(moveX);
                    const travelY =
                        this.lastPoint.travelY === null
                            ? Math.abs(moveY)
                            : this.lastPoint.travelY + Math.abs(moveY);
                    return Object.assign(DEFAULT_LAST_POINT, {
                        x,
                        y,
                        movementX: moveX,
                        movementY: moveY,
                        distanceX: x - this.startPointX,
                        distanceY: y - this.startPointY,
                        travelX,
                        travelY,
                        travel:
                            (this.lastPoint.travel || 0) +
                            Math.sqrt(Math.pow(moveX, 2) + Math.pow(moveY, 2)),
                        pinchLevel,
                        pinchLength,
                        pinchLevelStart: this.pinchLevelStart,
                        rotate: rotate,
                        rotateAbsolute,
                        rotateStart: this.rotateStart,
                    });
                }
            }
        }
        return DEFAULT_LAST_POINT;
    }
    protected setThresholdValue() {
        this.thresholdMinX = this.startPointX - this.threshold;
        this.thresholdMaxX = this.startPointX + this.threshold;
        this.thresholdMinY = this.startPointY - this.threshold;
        this.thresholdMaxY = this.startPointY + this.threshold;
    }

    /**
     * @param {OnGestureType} onGesture 제스쳐를 인식할 엘리먼트
     */
    constructor(
        onGesture: OnGestureType,
        option: Partial<GestureObserverOptionType> = {}
    ) {
        const { observeGesture, observePointer, threshold } = option;
        this.onGesture = onGesture;
        if (observeGesture !== undefined)
            this.observeGesture = new Set(observeGesture);
        if (observePointer !== undefined)
            this.observePointer = new Set(observePointer);
        if (threshold !== undefined) this.threshold = threshold;
    }
    private init() {
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
        // globalThis.addEventListener('wheel', this.wheelHandler, {
        //     passive: false,
        // });
        this.inited = true;
    }
    observe(element: HTMLElement) {
        if (this.inited === false) {
            this.init();
        }
        this.observeElements.add(element);
    }
    unobserve(element: HTMLElement) {
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
