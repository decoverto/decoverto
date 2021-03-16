export interface ValidationErrorInput {
    path: string;
}

export abstract class ValidationError extends TypeError {
    path: string;

    protected constructor(input: ValidationErrorInput) {
        super();

        this.path = input.path;
    }
}
