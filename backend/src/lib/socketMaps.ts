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
    this.valueToKey.delete(value);
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

  forEachValue(callbackFn: (key: T1, value: T2, map: Map<T2, T1>) => void) {
    return this.valueToKey.forEach(callbackFn);
  }
}

export const socketMap = new BidirectionalMap<string, WebSocket>();

export class BidirectionalGroupedMap<T1, T2> {
  keyToValue: Map<T1, T2>;
  valueToKey: Map<T2, Set<T1>>;

  constructor() {
    this.keyToValue = new Map<T1, T2>();
    this.valueToKey = new Map<T2, Set<T1>>();
  }

  hasKey(key: T1): boolean {
    return this.keyToValue.has(key);
  }

  hasValue(value: T2): boolean {
    return this.valueToKey.has(value);
  }

  set(key: T1, value: T2) {
    const prevValue = this.keyToValue.get(key);
    if (prevValue) {
      const prevSet = this.valueToKey.get(prevValue);
      prevSet?.delete(key);
      this.keyToValue.delete(key);
    }
    let set = this.valueToKey.get(value);
    if (!set) {
      set = new Set<T1>();
    }
    set.add(key);
    this.valueToKey.set(value, set);
    this.keyToValue.set(key, value);
  }

  deleteByKey(key: T1) {
    const value = this.keyToValue.get(key);
    if (value) {
      const set = this.valueToKey.get(value);
      set?.delete(key);
      if (set?.size === 0) {
        this.valueToKey.delete(value);
      }
    }
    this.keyToValue.delete(key);
  }

  getByKey(key: T1): T2 | undefined {
    return this.keyToValue.get(key);
  }

  getByValue(value: T2): Set<T1> | undefined {
    return this.valueToKey.get(value);
  }

  getByValueAsArray(value: T2): T1[] | undefined {
    const set = this.valueToKey.get(value);
    if (!set) return set;
    return [...set];
  }

  forEach(callbackFn: (value: T2, key: T1, map: Map<T1, T2>) => void) {
    return this.keyToValue.forEach(callbackFn);
  }
}

export const userActiveChatroomMap = new BidirectionalGroupedMap<
  string,
  string
>();
