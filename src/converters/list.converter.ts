import {ConversionContext, Converter} from './converter';

/**
 * Abstract class to be used for any type that is represented as an array in plain form. E.g. Array,
 * Set.
 *
 * Generic parameters' explanation:
 *
 * Example: `Array<string>` is declared as `@property(array(() => String))`. This results in:
 *
 * `ClassWrapper`: The type of the structure holding the data, `Array<string>`.
 *
 * `Class`: String The type of the data held in the structure, e.g. String in Array<string>.
 *
 * `Plain`: String The type of data used in the plain-form array.
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
