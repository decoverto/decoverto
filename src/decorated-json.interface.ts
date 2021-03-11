export interface MappedTypeConverters<T> {

    /**
     * Use this deserializer to convert a JSON value to the type.
     */
    deserializer?: ((json: any) => T | null | undefined) | null;

    /**
     * Use this serializer to convert a type back to JSON.
     */
    serializer?: ((value: T | null | undefined) => any) | null;
}
