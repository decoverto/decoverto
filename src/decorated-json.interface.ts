export interface MappedTypeConverters<T> {

    /**
     * Use this function to convert a JSON value to the type.
     */
    fromJson?: ((json: any) => T | null | undefined) | null;

    /**
     * Use this function to convert a type back to JSON.
     */
    toJson?: ((value: T | null | undefined) => any) | null;
}
