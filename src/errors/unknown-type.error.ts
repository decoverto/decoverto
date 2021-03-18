import {getDiagnostic} from '../diagnostics';
import {ValidationError, ValidationErrorInput} from './validation.error';

export interface UnknownTypeErrorInput extends ValidationErrorInput {
    type: string;
}

export class UnknownTypeError extends ValidationError {
    constructor(input: UnknownTypeErrorInput) {
        super({
            path: input.path,
        });

        this.message = getDiagnostic('unknownTypeError', input);
    }
}
