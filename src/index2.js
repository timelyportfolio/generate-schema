// browserify standalone
// thx http://www.forbeslindesay.co.uk/post/46324645400/standalone-browserify-builds
//  at command prompt
//  browserify index2.js --standalone schema-json > json_schema.js

var schema_json = require('./schemas/json')
module.exports = schema_json