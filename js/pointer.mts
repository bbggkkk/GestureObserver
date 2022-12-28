// export interface PointerInterface {
//     pointerType: PointerType;
// }

export type PointerType = 'mouse' | 'touch' | 'pen' | null;
export type PointerPoint = number | null;
export type PointerPresure = number | null;

export default class PointerTypeObject {
    pointerType: PointerType;
    pointerX: PointerPoint;
    pointerY: PointerPoint;
    presure: PointerPresure;
    constructor() {
        this.pointerType = null;
        this.pointerX = null;
        this.pointerY = null;
        this.presure = null;
    }
}
