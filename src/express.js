'use strict';

const express = require('express');
const app = express();
const cors = require('cors');
const errorHandler = require('./errorHandler');
const dotenvPrefix = 'production'

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

console.log('API initialized successfully.');

/**
 * Final error handler
 * ---------------------------------------------------------------------------*/
app.use(errorHandler);

module.exports = app;
