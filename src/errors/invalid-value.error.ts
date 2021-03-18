import {getDiagnostic} from '../diagnostics';
import {ValidationError, ValidationErrorInput} from './validation.error';

export interface InvalidValueErrorInput extends ValidationErrorInput {
    actualType: string;
    expectedType: string;
}

export class InvalidValueError extends ValidationError {
    constructor(input: InvalidValueErrorInput) {
        super({
            path: input.path,
        });

        this.message = getDiagnostic('invalidValueError', input);
    }
}
