import {ConversionContext, TypeDescriptor} from './type-descriptor';

export class AnyTypeDescriptor extends TypeDescriptor {

    fromJson(params: ConversionContext<any>): any {
        return params.source;
    }

    toJson(params: ConversionContext<any>): any {
        return params.source;
    }

    getFriendlyName(): string {
        return 'Any';
    }
}

export const Any = new AnyTypeDescriptor();
