 
class ApiResponse {
    constructor(
        statusCode,
        message = "Success",
        data = null
    ) {
        this.statusCode = statusCode;
        this.success = statusCode < 400;
        this.message = message;
        this.data = data;
        this.errors = []; // Keep same shape
    }
}

export { ApiResponse };
