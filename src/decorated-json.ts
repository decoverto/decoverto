import {DecoratedJsonTypeHandler} from './decorated-json-type-handler';
import {MappedTypeConverters} from './decorated-json.interface';
import {JsonHandler} from './json-handler';
import {Serializable} from './types';

interface DecoratedJsonSettings {

    /**
     * Used to configure reviver, replacer, and spaces used in `JSON` methods or use a custom
     * JSON parser. Expects a class implementing `JsonHandler`. Example:
     * ```TypeScript
     * import {JsonHandlerSimple} from 'decorated-json';
     *
     * const jsonHandler = new JsonHandlerSimple({
     *     spaces: 4,
     * });
     * ```
     */
    jsonHandler?: JsonHandler;
}

export class DecoratedJson {

    private readonly customSerializationStrategies = new Map<Serializable<any>,
        MappedTypeConverters<any>>();

    constructor(
        private readonly settings: DecoratedJsonSettings = {},
    ) {
    }

    mapType<T, R = T>(type: Serializable<T>, converters: MappedTypeConverters<R>): void {
        this.customSerializationStrategies.set(type, converters);
    }

    type<T>(type: Serializable<T>): DecoratedJsonTypeHandler<T> {
        const handler = new DecoratedJsonTypeHandler<T>(type, {
            jsonHandler: this.settings.jsonHandler,
        });
        this.customSerializationStrategies.forEach((converters, serializationType) => {
            handler.setSerializationStrategies(serializationType, converters);
        });

        return handler;
    }
}
