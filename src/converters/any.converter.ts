import {ConversionContext, Converter} from './converter';

export class AnyConverter extends Converter {

    toInstance(params: ConversionContext<any>): any {
        return params.source;
    }

    toPlain(params: ConversionContext<any>): any {
        return params.source;
    }

    getFriendlyName(): string {
        return 'Any';
    }
}

export const Any = new AnyConverter();
