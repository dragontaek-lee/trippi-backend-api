'use strict';

const express = require('express');
const app = express();
const cors = require('cors');
const errorHandler = require('./errorHandler');
const gateAuth = require('./Gates/gateAuth');
const dotenvPrefix = 'production';

require('dotenv').config({ path: `${__dirname}/../.env.${dotenvPrefix}` })

/**
 * Fundamental middleware chain
 * ---------------------------------------------------------------------------*/

// give request time
app.use((req, res, next) => {
    req.now = Date.now();
    next();
});

app.use(cors({ exposedHeaders: 'content-disposition' }));

// json, query, formData parser
app.use(express.json());
app.use((error, req, res, next) => {
    if (error !== null) console.warn('ErrorJsonParse');
    next();
});
app.use(express.urlencoded({ extended: true }));

app.use(gateAuth)
/**
 * Load route
 * ---------------------------------------------------------------------------*/
app.use('/auth', require('./main/auth/auth.controller'));
app.use('/region', require('./main/regions/region.controller'));
app.use('/upload', require('./main/upload/upload.controller'));
app.use('/user', require('./main/users/users.controller'));

console.log('API initialized successfully.');
/**
 * Final error handler
 * ---------------------------------------------------------------------------*/
app.use(errorHandler);

module.exports = app;
