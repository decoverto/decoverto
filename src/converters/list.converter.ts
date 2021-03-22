import {ConversionContext, Converter} from './converter';

/**
 * Abstract class to be used for any type that is represented as an array in JSON. E.g. Array, Set.
 */
export abstract class ListConverter<ClassWrapper, Class, Json = any>
    extends Converter<ClassWrapper, Array<Json> | null | undefined> {

    constructor(
        readonly type: Converter<Class>,
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
