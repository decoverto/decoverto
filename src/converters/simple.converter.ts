import {Serializable} from '../types';
import {Converter} from './converter';

/**
 * Basis of all converters that represent a single, non-wrapped, type. E.g. Date, Boolean, ...
 */
export abstract class SimpleConverter<Class extends Object = any, Plain = any>
    extends Converter<Class | null | undefined, Plain> {

    constructor(
        readonly type: Serializable<Class>,
    ) {
        super();
    }

    getFriendlyName(): string {
        return this.type.name;
    }
}
