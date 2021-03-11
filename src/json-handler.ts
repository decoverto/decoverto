export interface JsonHandler {
    parse: (text: string) => any;
    stringify: (value: any) => string;
}

export interface JsonHandlerSimpleSettings {

    /**
     * A string or number that is used to insert white space into the output JSON string for
     * readability purposes.
     *
     * If this is a Number, it indicates the number of space characters to use as white space;
     * this number is capped at 10 (if it is greater, the value is just 10). Values less than 1
     * indicate that no space should be used.
     *
     * If this is a String, the string (or the first 10 characters of the string, if it's longer
     * than that) is used as white space.
     *
     * If this is undefined, no white space is used.
     */
    spaces?: number | string;

    /**
     * A function that alters the behavior of the stringification process, or an array of String and
     * Number that serve as a whitelist for selecting/filtering the properties of the value object
     * to be included in the JSON string. If this property is undefined, all properties of the
     * object are included in the resulting JSON string.
     */
    replacer?: (this: any, key: string, value: any) => any;

    /**
     * This prescribes how the value originally produced by parsing is transformed, before being
     * returned.
     */
    reviver?: (this: any, key: string, value: any) => any;
}

export class JsonHandlerSimple implements JsonHandler {

    constructor(
        private readonly settings: JsonHandlerSimpleSettings,
    ) {
    }

    parse(text: string): any {
        return JSON.parse(text, this.settings.reviver);
    }

    stringify(value: any): string {
        return JSON.stringify(value, this.settings.replacer, this.settings.spaces);
    }
}
