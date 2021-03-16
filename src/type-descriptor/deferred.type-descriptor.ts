import {ConcreteTypeDescriptor} from './concrete.type-descriptor';
import {
    ConversionContext,
    TypeDescriptor,
    TypeThunk,
} from './type-descriptor';

export class DeferredTypeDescriptor<Class>
    extends TypeDescriptor<Class | null | undefined> {

    private resolvedDescriptor: ConcreteTypeDescriptor<Class> | undefined;

    constructor(
        private readonly thunk: TypeThunk<Class>,
    ) {
        super();
    }

    fromJson(context: ConversionContext<any>): Class | null | undefined {
        return this.getConcreteTypeDescriptor().fromJson(context);
    }

    toJson(context: ConversionContext<Class | null | undefined>): any {
        return this.getConcreteTypeDescriptor().toJson(context);
    }

    getFriendlyName(): string {
        return this.thunk().name;
    }

    private getConcreteTypeDescriptor(): ConcreteTypeDescriptor<Class> {
        if (this.resolvedDescriptor === undefined) {
            this.resolvedDescriptor = new ConcreteTypeDescriptor<Class>(this.thunk());
        }

        return this.resolvedDescriptor;
    }
}
