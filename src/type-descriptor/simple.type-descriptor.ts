import {Serializable} from '../types';
import {TypeDescriptor} from './type-descriptor';

/**
 * Basis of all type descriptors representing a single type. E.g. Date, Boolean, ...
 */
export abstract class SimpleTypeDescriptor<Class extends Object = any, Json = any>
    extends TypeDescriptor<Class | null | undefined, Json> {

    constructor(
        readonly type: Serializable<Class>,
    ) {
        super();
    }

    getFriendlyName(): string {
        return this.type.name;
    }
}
