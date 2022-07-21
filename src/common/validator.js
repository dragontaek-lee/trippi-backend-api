/**
  * Validate request body
  *
  * @param {object} schema joi schema
  */
 exports.body = (schema) => (req, res, next) => {
     const { error, value } = schema.validate(req.body);
     if (error !== undefined) {
         let errorMessage = error.details.map((x) => x.message).join(', ');
 
         return res.status(422).send(errorMessage);
     }
 
     req.body = value;
     next();
 };
 
 /**
  * Validate request query string
  *
  * @param {object} schema joi schema
  */
 exports.query = (schema) => (req, res, next) => {
     const { error, value } = schema.validate(req.query);
     if (error !== undefined) {
         let errorMessage = error.details.map((x) => x.message).join(', ');
 
         return res.status(422).send(errorMessage);
     }
 
     req.query = value;
     next();
 };
 