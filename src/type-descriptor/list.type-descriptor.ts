import {ConversionContext, TypeDescriptor} from './type-descriptor';

/**
 * Abstract class to be used for any type that is represented as an array in JSON. E.g. Array, Set.
 */
export abstract class ListTypeDescriptor<ClassWrapper, Class, Json = any>
    extends TypeDescriptor<ClassWrapper, Array<Json> | null | undefined> {

    constructor(
        readonly type: TypeDescriptor<Class>,
    ) {
        super();
    }

    abstract fromJson(
        params: ConversionContext<Array<Json> | null | undefined>,
    ): ClassWrapper;
    abstract toJson(
        params: ConversionContext<ClassWrapper>,
    ): Array<Json> | null | undefined;
}
