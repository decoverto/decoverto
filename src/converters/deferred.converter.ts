import {ConcreteConverter} from './concrete.converter';
import {
    ConversionContext,
    Converter,
    TypeThunk,
} from './converter';

export class DeferredConverter<Class>
    extends Converter<Class | null | undefined> {

    private resolvedConverter: ConcreteConverter<Class> | undefined;

    constructor(
        private readonly thunk: TypeThunk<Class>,
    ) {
        super();
    }

    toInstance(context: ConversionContext<any>): Class | null | undefined {
        return this.getConverter().toInstance(context);
    }

    toPlain(context: ConversionContext<Class | null | undefined>): any {
        return this.getConverter().toPlain(context);
    }

    getFriendlyName(): string {
        return this.thunk().name;
    }

    private getConverter(): ConcreteConverter<Class> {
        if (this.resolvedConverter === undefined) {
            this.resolvedConverter = new ConcreteConverter<Class>(this.thunk());
        }

        return this.resolvedConverter;
    }
}
