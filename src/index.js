'use strict';

require('./firebase');
const app = require('./express');

const PORT = process.env.PORT || 20200;

app.listen(PORT, () => {
    console.log('app listen on port: ' + PORT);
});
