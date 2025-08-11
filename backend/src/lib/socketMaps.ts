import type WebSocket from "ws";

export class BidirectionalMap<T1, T2> {
    readonly keyToValue: Map<T1, T2>;
    readonly valueToKey: Map<T2, T1>;

    constructor() {
        this.keyToValue = new Map<T1, T2>();
        this.valueToKey = new Map<T2, T1>();
    }

    hasKey(key: T1) {
        return this.keyToValue.has(key);
    }

    hasValue(value: T2) {
        return this.valueToKey.has(value);
    }

    set(key: T1, value: T2) {
        this.keyToValue.set(key, value);
        this.valueToKey.set(value, key);
    }

    deleteByKey(key: T1) {
        const value = this.keyToValue.get(key);
        if (value) this.valueToKey.delete(value);
        this.keyToValue.delete(key);
    }

    deleteByValue(value: T2) {
        const key = this.valueToKey.get(value);
        if (key) this.keyToValue.delete(key);
        this.valueToKey.delete(value);
    }

    getByKey(key: T1) {
        return this.keyToValue.get(key);
    }

    getByValue(value: T2) {
        return this.valueToKey.get(value);
    }

    forEach(callbackFn: (value: T2, key: T1, map: Map<T1, T2>) => void) {
        return this.keyToValue.forEach(callbackFn);
    }
}

export const socketMap = new BidirectionalMap<{userId: string, isUser: boolean}, WebSocket>();