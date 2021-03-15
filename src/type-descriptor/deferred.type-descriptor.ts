import {ConcreteTypeDescriptor} from './concrete.type-descriptor';
import {
    ConversionContext,
    TypeDescriptor,
    TypeThunk,
} from './type-descriptor';

export class DeferredTypeDescriptor<Class extends Object, Json>
    extends TypeDescriptor<Class, Json> {

    private resolvedDescriptor: ConcreteTypeDescriptor<Class, Json> | undefined;

    constructor(
        private readonly thunk: TypeThunk<Class>,
    ) {
        super();
    }

    fromJson(context: ConversionContext<Json | null | undefined>): Class | null | undefined {
        return this.getConcreteTypeDescriptor().fromJson(context);
    }

    toJson(context: ConversionContext<Class | null | undefined>): Json | null | undefined {
        return this.getConcreteTypeDescriptor().toJson(context);
    }

    getFriendlyName(): string {
        return this.thunk().name;
    }

    private getConcreteTypeDescriptor(): ConcreteTypeDescriptor<Class, Json> {
        if (this.resolvedDescriptor === undefined) {
            this.resolvedDescriptor = new ConcreteTypeDescriptor<Class, Json>(this.thunk());
        }

        return this.resolvedDescriptor;
    }
}
