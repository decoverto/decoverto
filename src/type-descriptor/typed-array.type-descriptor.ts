import {SimpleTypeDescriptor} from './simple.type-descriptor';
import {ConversionContext} from './type-descriptor';

export type TypedArray =
    | Float32Array
    | Float64Array
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array;

export type TypedArrayStrings = '+∞' | '-0' | '-∞' | 'NaN';
export type TypedArrayItemJson = number | TypedArrayStrings;

export class TypedArrayTypeDescriptor extends SimpleTypeDescriptor<TypedArray> {

    fromJson(context: ConversionContext<any | null>): TypedArray | null | undefined {
        if (context.source == null) {
            return context.source;
        }

        const {source} = context;

        if (!Array.isArray(source)) {
            this.throwTypeMismatchError({
                ...context,
                expectedType: 'a numeric array',
            });
        }

        return new this.type(source.map(item => this.itemFromJson(item)));
    }

    toJson(
        context: ConversionContext<any | null | undefined>,
    ): Array<TypedArrayItemJson> | null | undefined {
        if (context.source == null) {
            return context.source;
        }

        if (!(context.source instanceof this.type)) {
            this.throwTypeMismatchError(context);
        }

        return Array.from(context.source).map(item => this.itemToJson(item));
    }

    private itemFromJson(item: TypedArrayItemJson): number {
        if (typeof item === 'number') {
            return item;
        }

        switch (item) {
            case '+∞':
                return Infinity;
            case '-0':
                return -0;
            case '-∞':
                return -Infinity;
            case 'NaN':
                return NaN;
        }
    }

    private itemToJson(item: number): TypedArrayItemJson {
        if (item === Infinity) {
            return '+∞';
        } else if (Object.is(item, -0)) {
            return '-0';
        } else if (item === -Infinity) {
            return '-∞';
        } else if (isNaN(item)) {
            return 'NaN';
        } else {
            return item;
        }
    }
}
