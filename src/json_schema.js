!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.schemaJson=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (factory) {  
  if (typeof exports == 'object') {
    module.exports = factory();
  } else if ((typeof define == 'function') && define.amd) {
    define(factory);
  }
}(function () {

  var isBuiltIn = (function () {
    var built_ins = [
      Object,
      Function,
      Array,
      String,
      Boolean,
      Number,
      Date,
      RegExp,
      Error
    ];
    var built_ins_length = built_ins.length;

    return function (_constructor) {
      for (var i = 0; i < built_ins_length; i++) {
        if (built_ins[i] === _constructor) {
          return true;
        }
      }
      return false;
    };
  })();

  var stringType = (function () {
    var _toString = ({}).toString;

    return function (obj) {
      // For now work around this bug in PhantomJS
      // https://github.com/ariya/phantomjs/issues/11722
      if (obj === null) {
        return 'null';
      } else if (obj === undefined) {
        return 'undefined';
      }

      // [object Blah] -> Blah
      var stype = _toString.call(obj).slice(8, -1);

      // Temporarily elided see commented on line 37 above
      // if ((obj === null) || (obj === undefined)) {
      //   return stype.toLowerCase();
      // }

      var ctype = of(obj);

      if (ctype && !isBuiltIn(ctype)) {
        return ctype.name;
      } else {
        return stype;
      }
    };
  })();

  function of (obj) {
    if ((obj === null) || (obj === undefined)) {
      return obj;
    } else {
      return obj.constructor;
    }
  }

  function is (obj, test) {
    var typer = (of(test) === String) ? stringType : of;
    return (typer(obj) === test);
  }
  
  function instance (obj, test) {
    return (obj instanceof test);
  }

  function extension (_Extension, _Base) {
    return instance(_Extension.prototype, _Base);
  }

  function any (obj, tests) {
    if (!is(tests, Array)) {
      throw ("Second argument to .any() should be array")
    }
    for (var i = 0; i < tests.length; i++) {
      var test = tests[i];
      if (is(obj, test)) {
        return true;
      }
    }
    return false;
  }
  
  var exports = function (obj, type) {
    if (arguments.length == 1) {
      return of(obj);
    } else {
      if (is(type, Array)) {
        return any(obj, type);
      } else {
        return is(obj, type);
      }
    }
  }

  exports.instance  = instance;
  exports.string    = stringType;
  exports.of        = of;
  exports.is        = is;
  exports.any       = any;
  exports.extension = extension;
  return exports;

}));

},{}],2:[function(require,module,exports){
// browserify standalone
// thx http://www.forbeslindesay.co.uk/post/46324645400/standalone-browserify-builds
//  at command prompt
//  browserify index2.js --standalone schema-json > json_schema.js

var schema_json = require('./schemas/json')
module.exports = schema_json
},{"./schemas/json":3}],3:[function(require,module,exports){
// Modules
var Type = require('type-of-is')

// Constants
var DRAFT = "http://json-schema.org/draft-04/schema#"

function getUniqueKeys (a, b, c) {
  var a = Object.keys(a)
  var b = Object.keys(b)
  var c = c || []
  var value
  var cIndex
  var aIndex

  for (var keyIndex = 0, keyLength = b.length; keyIndex < keyLength; keyIndex++) {
    value = b[keyIndex]
    aIndex = a.indexOf(value)
    cIndex = c.indexOf(value)

    if (aIndex === -1) {
      if (cIndex !== -1) {
        // Value is optional, it doesn't exist in A but exists in B(n)
        c.splice(cIndex, 1)
      }
    } else if (cIndex === -1) {
      // Value is required, it exists in both B and A, and is not yet present in C
      c.push(value)
    }
  }

  return c
}

function processArray (array, output, nested) {
  var oneOf
  var type

  if (nested && output) {
    output = {
      items: output
    }
  } else {
    output = output || {}
    output.type = Type.string(array).toLowerCase()
    output.items = output.items || {}
  }

  // Determine whether each item is different
  for (var index = 0, length = array.length; index < length; index++) {
    var elementType = Type.string(array[index]).toLowerCase()

    if (type && elementType !== type) {
      output.items.oneOf = []
      oneOf = true
      break
    } else {
      type = elementType
    }
  }

  // Setup type otherwise
  if (!oneOf) {
    output.items.type = type
  }

  // Process each item depending
  if (typeof output.items.oneOf !== 'undefined' || type === 'object') {
    for (var index = 0, length = array.length; index < length; index++) {
      var value = array[index]
      var itemType = Type.string(value).toLowerCase()
      var required = []
      var processOutput

      switch (itemType) {
        case "object":
          if (output.items.properties) {
            output.items.required = getUniqueKeys(output.items.properties, value, output.items.required)
          }

          processOutput = processObject(value, oneOf ? {} : output.items.properties, true)
          break

        case "array":
          processOutput = processArray(value, oneOf ? {} : output.items.properties, true)
          break

        default:
          processOutput = { type: itemType }
      }

      if (oneOf) {
        output.items.oneOf.push(processOutput)
      } else {
        output.items.properties = processOutput
      }
    }
  }

  return nested ? output.items : output
}

function processObject (object, output, nested) {
  if (nested && output) {
    output = {
      properties: output
    }
  } else {
    output = output || {}
    output.type = Type.string(object).toLowerCase()
    output.properties = output.properties || {}
  }

  for (var key in object) {
    var value = object[key]
    var type = Type.string(value).toLowerCase()

    if (type === 'undefined') {
      type = 'null'
    }

    switch (type) {
      case "object":
        output.properties[key] = processObject(value)
        break

      case "array":
        output.properties[key] = processArray(value)
        break

      default:
        output.properties[key] = {
          type: type
        }
    }
  }

  return nested ? output.properties : output
}

module.exports = function (title, object) {
  var processOutput
  var output = {
    $schema: DRAFT
  }

  // Determine title exists
  if (typeof title !== 'string') {
    object = title
    title = undefined
  } else {
    output.title = title
  }

  // Set initial object type
  output.type = Type.string(object).toLowerCase()

  // Process object
  switch (output.type) {
    case "object":
      processOutput = processObject(object)
      output.type = processOutput.type
      output.properties = processOutput.properties
      break

    case "array":
      processOutput = processArray(object)
      output.type = processOutput.type
      output.items = processOutput.items

      if (output.title) {
        output.items.title = output.title
        output.title += " Set"
      }

      break
  }

  // Output
  return output
}
},{"type-of-is":1}]},{},[2])(2)
});