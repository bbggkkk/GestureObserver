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
interface OnGestureParameter {
    observeElement: HTMLElement;
    isTab: boolean;
    isEnd: boolean;
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
        { x: number; y: number; pointerType: ObservePointerType }
    > = new Map();
    protected observeElements: Set<HTMLElement> = new Set();
    protected inited = false;

    protected isTab = false;
    protected isEnd = true;
    protected primaryType: ObservePointerMode = null;
    protected onGeustreMode: OnGestureMode = null;
    protected startPointX = 0;
    protected startPointY = 0;

    protected thresholdMinX = this.startPointX - this.threshold;
    protected thresholdMaxX = this.startPointX + this.threshold;
    protected thresholdMinY = this.startPointY - this.threshold;
    protected thresholdMaxY = this.startPointY + this.threshold;

    protected direction = 0;

    protected pointerHandler = (e: PointerEvent, path: EventTarget[]) => {
        const { pointerId, pointerType, target, offsetX, offsetY } = e;
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
        };
    };
    protected pointerDownHandler = (e: PointerEvent) => {
        const path = e.composedPath();
        requestAnimationFrame(() => {
            const {
                pointerId,
                pointerType,
                observeElement,
                target,
                offsetX,
                offsetY,
            } = this.pointerHandler(e, path);
            if (observeElement !== undefined) {
                if (e.isPrimary === true) {
                    this.primaryType = pointerType;
                }
                this.isTab = true;
                this.isEnd = false;
                this.pointerList.set(pointerId, e);
                const { x, y } = this.findActualPoint(
                    observeElement,
                    target as HTMLElement,
                    offsetX,
                    offsetY
                );
                this.pointerInfoList.set(pointerId, { pointerType, x, y });

                this.startPointX = x;
                this.startPointY = y;
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
                offsetX,
                offsetY,
            } = this.pointerHandler(e, path);
            if (this.isTab === true) {
                this.pointerList.set(pointerId, e);
                const { x, y } = this.findActualPoint(
                    observeElement,
                    target as HTMLElement,
                    offsetX,
                    offsetY
                );
                this.pointerInfoList.set(pointerId, { pointerType, x, y });
                if (
                    (this.onGeustreMode === null ||
                        this.onGeustreMode === 'pan-x') &&
                    (this.thresholdMinX > x || this.thresholdMaxX < x) &&
                    this.pointerList.size === 1
                ) {
                    this.onGeustreMode = 'pan-x';
                }
                if (
                    (this.onGeustreMode === null ||
                        this.onGeustreMode === 'pan-y') &&
                    (this.thresholdMinY > y || this.thresholdMaxY < y) &&
                    this.pointerList.size === 1
                ) {
                    this.onGeustreMode = 'pan-y';
                }
                if (
                    (this.onGeustreMode === null ||
                        this.onGeustreMode === 'pinch-zoom') &&
                    this.pointerList.size > 1
                ) {
                    this.onGeustreMode = 'pinch-zoom';
                }

                if (this.onGeustreMode !== null) {
                    this.onGesture(
                        {
                            gesture: this.onGeustreMode,
                            observeElement,
                            isTab: this.isTab,
                            isEnd: this.isEnd,
                            pointer: [...this.pointerInfoList.values()],
                            primaryType: this.primaryType,
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
            const {
                pointerId,
                pointerType,
                observeElement,
                target,
                offsetX,
                offsetY,
            } = this.pointerHandler(e, path);
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
                            observeElement,
                            isTab: this.isTab,
                            isEnd: this.isEnd,
                            pointer: [...this.pointerInfoList.values()],
                            primaryType: this.primaryType,
                        },
                        e,
                        this
                    );
                }

                this.primaryType = null;
                this.startPointX = 0;
                this.startPointY = 0;
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
        observeElement: HTMLElement,
        target: HTMLElement,
        offsetX: number,
        offsetY: number
    ) {
        let nowElement = target;
        let value = { x: offsetX, y: offsetY };
        while (nowElement !== observeElement) {
            if (nowElement.parentElement === null) break;
            value.x += nowElement.offsetLeft;
            value.y += nowElement.offsetTop;
            nowElement = nowElement.parentElement;
        }
        return value;
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
