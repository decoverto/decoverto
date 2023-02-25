export interface AbstractType<T> extends Function {
    prototype: T;
}

export type Constructor<T> = new (...args: Array<any>) => T;
export type Serializable<T extends {}> = Constructor<T> | AbstractType<T>;
