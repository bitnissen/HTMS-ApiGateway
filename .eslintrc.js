const path = require('path');

module.exports = {
    extends: 'airbnb-base',
    rules: {
        'import/no-extraneous-dependencies': ['off']
    },
    settings: {
        'import/resolver': 'module-alias',
    },
};