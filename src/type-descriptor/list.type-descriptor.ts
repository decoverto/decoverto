import {ConversionContext, TypeDescriptor} from './type-descriptor';

/**
 * Abstract class to be used for any type that is represented as an array in JSON. E.g. Array, Set.
 */
export abstract class ListTypeDescriptor<Class extends Object> extends TypeDescriptor {

    constructor(
        readonly type: TypeDescriptor<Class>,
    ) {
        super();
    }

    abstract fromJson(params: ConversionContext<Array<any>>): any;
    abstract toJson(params: ConversionContext<Array<any>>): any;
}
