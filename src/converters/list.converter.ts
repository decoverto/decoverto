import {ConversionContext, Converter} from './converter';

/**
 * Abstract class to be used for any type that is represented as an array in plain form. E.g. Array,
 * Set.
 */
export abstract class ListConverter<ClassWrapper, Class, Plain = any>
    extends Converter<ClassWrapper, Array<Plain> | null | undefined> {

    constructor(
        readonly type: Converter<Class>,
    ) {
        super();
    }

    abstract toInstance(
        params: ConversionContext<Array<Plain> | null | undefined>,
    ): ClassWrapper;
    abstract toPlain(
        params: ConversionContext<ClassWrapper>,
    ): Array<Plain> | null | undefined;
}
