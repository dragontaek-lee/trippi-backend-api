const TrippiException = require('./Exceptions/TrippiExecption');

module.exports = (error, req, res, next) => {
    if(error instanceof TrippiException) {
        console.log(`TrippiException: [${error.code}] ${error.message}`);
        console.log(error.stack.split('\n')[1]);

        return res.status(error.code).send(error.message);
    }

    console.error(error);
    return res.status(500).send();
};
