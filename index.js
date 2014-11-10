'use strict';

var childProcess = require('child_process'),
    nconf = require('nconf'),
    q = require('q'),
    fs = require('fs'),
    pki = require('node-forge').pki,
    winston = require('winston');


module.exports = function() {

    // Logging stuff           
    nconf.file({ file: './gebo.json' });
    var logLevel = nconf.get('logLevel');
    var logger = new (winston.Logger)({ transports: [ new (winston.transports.Console)({ colorize: true }) ] });

    /**
     * Mongo naming restriction constants
     */
    exports.constants = {
        at: '_at_',
        backslash: '_backslash_',
        colon: '_colon_',
        dollarSign: '_dollarsign_',
        dot: '_dot_',
        doubleQuotes: '_doublequotes_',
        greaterThan: '_greaterthan_',
        lessThan: '_lessthan_',
        noCollection: 'No collection',
        pipe: '_pipe_',
        questionMark: '_questionmark_',
        slash: '_slash_',
        space: '_space_',
        star: '_star_',
      };
    
    /**
     * Return a random int, used by `utils.uid()`
     *
     * @param {Number} min
     * @param {Number} max
     * @return {Number}
     * @api private
     */
    function _getRandomInt(min, max) {
        if (min > max) {
            throw 'min is bigger than max';
        }
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
    exports.getRandomInt = _getRandomInt;
    
    
    /**
     * Return a unique identifier with the given `len`.
     *
     *     utils.uid(10);
     *     // => "FDaS435D2z"
     *
     * @param int 
     * @return String
     */
    exports.getUid = function (len) {
        if (len <= 0) {
          throw 'A UID\'s length can\'t be less than or equal to zero';
        }
    
        var buf = [],
            chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
            charlen = chars.length;
    
        for (var i = 0; i < len; ++i) {
          buf.push(chars[_getRandomInt(0, charlen - 1)]);
        }
    
        return buf.join('');
      };
    
    /**
     * Make the gebo user's email address suitable for naming
     * a database... and more!
     * 
     * Mongo does not allow these characters: /\. "*<>:|? 
     * (http://docs.mongodb.org/manual/reference/limits/)
     *
     * This function sanitizes @s as well, though it is not
     * required by Mongo.
     *
     * @param string
     *
     * @return string
     */
    function _getMongoDbName(str) {
        if (!/[/\. "*<>:|?@]/.test(str)) {
          return str;
        }
        
        str = str.replace(/\//g, exports.constants.slash);
        str = str.replace(/\\/g, exports.constants.backslash);
        str = str.replace(/\./g, exports.constants.dot);
        str = str.replace(/ /g, exports.constants.space);
        str = str.replace(/"/g, exports.constants.doubleQuotes);
        str = str.replace(/\*/g, exports.constants.star);
        str = str.replace(/</g, exports.constants.lessThan);
        str = str.replace(/>/g, exports.constants.greaterThan);
        str = str.replace(/:/g, exports.constants.colon);
        str = str.replace(/\|/g, exports.constants.pipe);
        str = str.replace(/\?/g, exports.constants.questionMark);
        str = str.replace(/@/g, exports.constants.at);
    
        return str;
      };
    exports.getMongoDbName = _getMongoDbName;
    
    /**
     * Sanitize a mongo collection name. Find restrictions
     * on collections names here:
     *
     * http://docs.mongodb.org/manual/reference/limits/
     *
     * @param string
     *
     * @return string
     */
    exports.getMongoCollectionName = function(str) {
        if (str === undefined ||
            str === null || str.length === 0) {
          return exports.constants.noCollection;
        }
    
        str = str.replace(/\$/g, exports.constants.dollarSign);
    
        if (/^system\.|^[^A-Za-z_]/.test(str)) {
          str = '_' + str;
        }
        
        return str;
      };
    
    /**
     * Sanitize a mongo field name. Find restrictions
     * on collections names here:
     *
     * http://docs.mongodb.org/manual/reference/limits/
     *
     * @param string
     *
     * @return string
     */
    exports.getMongoFieldName = function(str) {
        if (str === undefined ||
            str === null || str.length === 0) {
          return exports.constants.noCollection;
        }
        
        str = str.replace(/\$/g, exports.constants.dollarSign);
        str = str.replace(/\./g, exports.constants.dot);
        return str;
      };
    
    /**
     * Given an flat object, return an URL-friendly query string.  Note
     * that for a given object, the return value may be.
     *  
     * @example
     * <pre>
     *    // returns 'color=red&size=large'
     *    _objectToQueryString({color: 'red', size: 'large'})
     * </pre>
     *
     * @param {Object} A flat object containing keys for a query string.
     * 
     * @returns {string} An URL-friendly query string.
     */
    exports.objectToQueryString = function(obj) {
        var str = [];
        for (var key in obj) {
          str.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
        }    
        return str.join('&');
      };
    
    /**
     * Take an email address and turn it into a mongo-friendly
     * database name
     *
     * @param string
     *
     * @return string
     */
    exports.ensureDbName = function(email) {
    //    if (!email) {
    //      email = nconf.get('email');
    //    }
        return _getMongoDbName(email);
      };
    
    
    /**
     * Append a copy number to a filename if a 
     * file by that same name already exists
     *
     * @param string
     * @param string
     *
     * @return promise
     */
    function _getSafeFileName(filename, directory) {
        var deferred = q.defer();
    
        fs.readdir(directory, function(err, files) {
    
            if(err) {
              // This means the directory doesn't exist
              if (err.errno === 34 && err.code === 'ENOENT') {
                deferred.resolve(filename);
              }
              else {
                deferred.reject(err);
              }
            }
            else {
              var index = files.indexOf(filename);
              if (index > -1) { 
    
                // Get filename and extension (if it has one)
                var name, extension;
                var splitString = filename.split('.');
    
                // Has extension
                if (splitString.length > 1) {
                  extension = splitString.pop(); 
                  name = splitString.join('.');
    
                  // Wait! Is this a hidden file?
                  if (!name) {
                    name = '.' + extension;
                    extension = '';
                  }
                }
                // No extension
                else {
                  name = filename;
                  extension = '';
                }
    
                // Get the copy number appended to the name and increment, if any
                var matches = name.match(/\((\d+)\)$/);
                if (matches) {
                  var copyNumber = Number(matches[1]) + 1;
                  name = name.replace(/\((\d+)\)$/, '(' + copyNumber + ')'); 
                }
                else {
                  name += '(1)';
                }
    
                // Assemble new filename
                if (extension) {
                  filename = name + '.' + extension;
                }
                else {
                  filename = name;
                }
    			deferred.resolve(_getSafeFileName(filename, directory));
              }
    		  else {
              	deferred.resolve(filename);
    		  }
            }       
          });
    
        return deferred.promise;
      };
    exports.getSafeFileName = _getSafeFileName;
    
    /**
     * Get the index of the first object containing the matching
     * key-value pair
     *
     * @param Array of Objects
     * @param string
     * @param string, number
     *
     * @return int
     */
    exports.getIndexOfObject = function(array, key, value) {
        for (var i = 0; i < array.length; i++) {
          if (array[i][key] === value) {
            return i;
          }
        }
        return -1; 
      };
    
    /**
     * Generate a private key and self-signed certificate
     * in PEM format
     *
     * @return Object
     */
    exports.getPrivateKeyAndCertificate = function() {
        var deferred = q.defer();
        pki.rsa.generateKeyPair(512, function(err, keys) {
            if (err) {
              deferred.reject(err);
            }
            else {
              var cert = pki.createCertificate();
              cert.publicKey = keys.publicKey;
              cert.sign(keys.privateKey);
              cert.validity.notAfter = new Date() + 3600*24*365*10;       
    
              deferred.resolve({
                      privateKey: pki.privateKeyToPem(keys.privateKey),
                      certificate: pki.certificateToPem(cert)
                  });
            }
    
          });
        return deferred.promise;
    
      };
    
    /**
     * Take the incoming filename and its extension
     * and return the hypothetical output filename
     *
     * @param string
     * @param string
     *
     * @return string
     */
    function _getOutputFileName(path, extension) {
        var filename = path.split('/');
        filename = filename[filename.length - 1];
        filename = filename.split('.');
    
        // No extension found
        if (filename.length === 1) {
          return filename[0] + '.' + extension;
        }
    
        // Hidden file
        if (filename[0] === '') {
          filename = filename.slice(1);
          filename[0] = '.' + filename[0];
          if (filename.length === 1) {
            return filename[0] + '.' + extension;
          }
        }
    
        filename = filename.slice(0, -1);
        
        return filename + '.' + extension;
      };
    exports.getOutputFileName = _getOutputFileName;
  
    /**
     * Set time limit on operating system process
     *
     * @param object
     * @param string
     * @param function
     *
     * @return timeoutObject
     */
    function _setTimeLimit(options, pidFile, done) {
        if (options.timeLimit) {
          var timeout = setTimeout(function() {
            var kill = 'kill $(cat ' + pidFile + ')';
            if (logLevel === 'trace') logger.warn('gebo-tesseract-action', kill);
            childProcess.exec(kill, function(err, stdout, stderr) {
                if (err) {
                  if (logLevel === 'trace') logger.error('gebo-tesseract-action', 'timeout', err);
                }
                if (stderr) {
                  if (logLevel === 'trace') logger.warn('gebo-tesseract-action', 'timeout', stderr);
                }
                if (stdout) {
                  if (logLevel === 'trace') logger.info('gebo-tesseract-action', 'timeout', stdout);
                }
              });
          }, options.timeLimit);
          done(timeout);
        }
        else {
          done(false);
        }
      };
    exports.setTimeLimit = _setTimeLimit;

    /**
     * Clear the timer and record the time remaining
     *
     * @param timeoutObject
     * @param object
     */
    function _stopTimer(timer, options) {
        if (timer) {
          options.timeLimit = _getTimeLeft(timer);
          clearTimeout(timer);
        }
      };
    exports.stopTimer = _stopTimer;

    /**
     * Get time left
     *
     * 2014-11-6
     * http://stackoverflow.com/questions/3144711/javascript-find-the-time-left-in-a-settimeout
     * Courtesy of Fluffy
     *
     * @param timeoutObject
     *
     * @return integer
     */
    function _getTimeLeft(timeout) {
        return Math.ceil(timeout._idleStart + timeout._idleTimeout - Date.now());
      };
    exports.getTimeLeft = _getTimeLeft;   

    return exports;
  }();
