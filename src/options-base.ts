/**
 * This options cascade through the annotations. Options set
 * in the more specific place override the previous option.
 * The order from highest to lowest precedence is as follows:
 * 1. @jsonProperty options
 * 1. @jsonObject options
 * 1. TypeHandler options
 * 1. DecoratedJson options
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OptionsBase {
}

const kAllOptions: Array<keyof OptionsBase> = [
] as Array<keyof OptionsBase>; // cast while no options exist

export function extractOptionBase(
    from: {[key: string]: any} & OptionsBase,
): OptionsBase | undefined {
    const options = Object.keys(from)
        .filter(key => (kAllOptions as Array<string>).indexOf(key) > -1)
        .reduce((obj, key) => {
            obj[key] = from[key];
            return obj;
        }, {} as any);
    return Object.keys(options).length > 0 ? options : undefined;
}

export function mergeOptions(
    existing?: OptionsBase,
    moreSpecific?: OptionsBase | null,
): OptionsBase | undefined {
    return moreSpecific == null
        ? existing
        : {

            ...existing,
            ...moreSpecific,
        };
}
