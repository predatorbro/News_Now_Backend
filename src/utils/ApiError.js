 
class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.success = false;
        this.data = null;
        this.message = message;
        this.errors = Array.isArray(errors) ? errors : [errors];

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    toJSON() {
        return {
            statusCode: this.statusCode,
            success: this.success,
            message: this.message,
            data: this.data,
            errors: this.errors
        };
    }
}

export { ApiError };
