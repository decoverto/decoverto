import {ValidationError, ValidationErrorInput} from './validation.error';

export interface UnknownTypeErrorInput extends ValidationErrorInput {
    type: string;
}

export class UnknownTypeError extends ValidationError {
    constructor(input: UnknownTypeErrorInput) {
        super({
            path: input.path,
        });

        this.message = `Could not determine how to convert unknown type ${input.type} at ${
            input.path}`;
    }
}
