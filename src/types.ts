export interface AbstractType<T> extends Function {
    prototype: T;
}

export type Constructor<T> = new (...args: Array<any>) => T;
export type Serializable<T> = Constructor<T> | AbstractType<T>;
