import {ConversionContext, Converter} from './converter';

export class AnyConverter extends Converter {

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

export const Any = new AnyConverter();
