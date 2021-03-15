import {ConversionContext, TypeDescriptor} from './type-descriptor';

export class AnyTypeDescriptor extends TypeDescriptor {

    fromJson(params: ConversionContext<any>): any {
        return params.sourceObject;
    }

    toJson(params: ConversionContext<any>): any {
        return params.sourceObject;
    }

    getFriendlyName(): string {
        return 'Any';
    }
}

export const Any = new AnyTypeDescriptor();
