class TrippiException extends Error {
    constructor(httpCode, ...arg) {
        super(...arg);

        if(Error.captureStackTrace)
            Error.captureStackTrace(this, TrippiException);

        if(typeof arg[0] === 'object') this.msg = arg[0];
        this.code = httpCode;

        Object.setPrototypeOf(this, TrippiException.prototype);
    }
}

module.exports = TrippiException;
