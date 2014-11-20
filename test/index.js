var childProcess = require('child_process'),
    exec = childProcess.exec,
    path = require('path'),
    utils = require('..'),
    fs = require('fs-extra'),
    sinon = require('sinon');


/**
 * getMongoCollectionName
 */
exports.getMongoCollectionName = {

    'Remove $s': function(test) {
        test.expect(1);
        var str = '$$ bill, y\'all!$!';
        var collectionName = utils.getMongoCollectionName(str);
        test.equal(collectionName, '_dollarsign__dollarsign_ bill, y\'all!_dollarsign_!');
        test.done();
    },

    'Handle an empty string': function(test) {
        test.expect(1);
        var str = '';
        var collectionName = utils.getMongoCollectionName(str);
        test.equal(collectionName, 'No collection');
        test.done();
    },

    'Prepend a _ to names starting with digits': function(test) {
        test.expect(1);
        var str = '12 ways to do something';
        var collectionName = utils.getMongoCollectionName(str);
        test.equal(collectionName, '_12 ways to do something');
        test.done();
    },

    'Handle a null character': function(test) {
        test.expect(1);
        var str = null;
        var collectionName = utils.getMongoCollectionName(str);
        test.equal(collectionName, 'No collection');
        test.done();
    },

    'Prepend a _ to the \'system.\' prefix': function(test) {
        test.expect(1);
        var str = 'system.meltdown';
        var collectionName = utils.getMongoCollectionName(str);
        test.equal(collectionName, '_system.meltdown');
        test.done();
    },

    'Prepend a _ to a non-alpha prefix': function(test) {
        test.expect(1);
        var str = '? hello'
        var collectionName = utils.getMongoCollectionName(str);
        test.equal(collectionName, '_? hello');
        test.done();
    },
};

/**
 * getMongoDbName
 */
exports.getMongoDbName = {

    'Remove periods and @s': function(test) {
        test.expect(1);
        var email = 'dan@email.com';
        var dbName = utils.getMongoDbName(email);
        test.equal(dbName, 'dan_at_email_dot_com', 'The email was properly sanitized')
        test.done();
    },

    'Remove forbidden characters': function(test) {
        test.expect(1);
        var str = '/\\. "*<>:|?';  
        var dbName = utils.getMongoDbName(str);
        test.equal(dbName, '_slash__backslash__dot_' +
                           '_space__doublequotes__star__lessthan_' +
                           '_greaterthan__colon__pipe__questionmark_',
                           'The forbidden string was properly sanitized')
        test.done();
    },

    'Don\'t alter names that have been cleaned already': function(test) {
        test.expect(2);
        var str = '/\\. "*<>:|?';  

        // Clean the data
        var dbName = utils.getMongoDbName(str);
        test.equal(dbName, '_slash__backslash__dot_' +
                           '_space__doublequotes__star__lessthan_' +
                           '_greaterthan__colon__pipe__questionmark_',
                           'The forbidden string was properly sanitized')
 
        // Clean it again
        var dbName = utils.getMongoDbName(dbName);
        test.equal(dbName, '_slash__backslash__dot_' +
                           '_space__doublequotes__star__lessthan_' +
                           '_greaterthan__colon__pipe__questionmark_',
                           'The forbidden string was properly sanitized')
        test.done();
    },
};


/**
 * getMongoFieldName
 */
exports.getMongoFieldName = {

    'Remove $s': function(test) {
        test.expect(1);
        var str = '$$ bill, y\'all!$!';
        var fieldName = utils.getMongoFieldName(str);
        test.equal(fieldName, '_dollarsign__dollarsign_ bill, y\'all!_dollarsign_!');
        test.done();
    },

    'Handle a null character': function(test) {
        test.expect(1);
        var str = null;
        var fieldName = utils.getMongoFieldName(str);
        test.equal(fieldName, utils.constants.noCollection);
        test.done();
    },

    'Remove periods': function(test) {
        test.expect(1);
        var str = 'will.i.am'; 
        var fieldName = utils.getMongoFieldName(str);
        test.equal(fieldName, 'will_dot_i_dot_am');
        test.done();
    },
};

/**
 * getRandomInt
 */
exports.getRandomInt = {

    'Return an integer greater than the max and less than the min': function(test) {
        test.expect(2);
        var randInt = utils.getRandomInt(10, 100);
        test.ok(randInt >= 10);
        test.ok(randInt <= 100);
        test.done();
    },

    'Return, as above, for negative numbers': function(test) {
        test.expect(2);
        var randInt = utils.getRandomInt(-100, -99);
        test.ok(randInt >= -100);
        test.ok(randInt <= -99);
        test.done();
    },

    'Should throw exception if min and max are reversed': function(test) {
        test.expect(1);
        try {
            var randInt = utils.getRandomInt(5, 1);
            test.ok(false);
        }
        catch(err) {
            test.equal(err, 'min is bigger than max');
            test.done();
        }
    },
};

/**
 * getUid
 */
exports.getUid = {

    'Return pseudo-random string of alphanumeric characters of the specified length': function(test) {
        test.expect(2);
        var uid = utils.getUid(1);
        test.ok(uid.length === 1);
        uid = utils.getUid(256);
        test.ok(uid.length === 256);
        test.done();
    },

    'Should throw exception if len is less than or equal to zero': function(test) {
        test.expect(2);
        var randInt;
        try {
            randInt = utils.getUid(0);
            test.ok(false);
        }
        catch(err) {
            test.equal(err, 'A UID\'s length can\'t be less than or equal to zero');
        }

        try {
            randInt = utils.getUid(-1);
            test.ok(false);
        }
        catch(err) {
            test.equal(err, 'A UID\'s length can\'t be less than or equal to zero');
            test.done();
        }
    },
    
};


/**
 * objectToQueryString
 */
exports.objectToQueryString = {

    'Take an object and spit out a query string': function(test) {
        test.expect(1);
        var obj = {
                response_type: 'token',
                client_id: 'abc123',
                redirect_uri: 'http://myhost.com',
                scope: ['*'],
            };
        test.equal(utils.objectToQueryString(obj),
                'response_type=token&client_id=abc123' +
                '&redirect_uri=' +
                encodeURIComponent('http://myhost.com') + '&scope=' + ['*']);
        test.done();
    }, 
};

/**
 * ensureDbName
 */
exports.ensureDbName = {
    'Return a mongo-friendly database name': function(test) {
        test.expect(2);
        var dbName = utils.ensureDbName('dan@example.com');
        test.equal(dbName, 'dan_at_example_dot_com');
        var dbName = utils.ensureDbName('dan_at_example_dot_com');
        test.equal(dbName, 'dan_at_example_dot_com');
        test.done();
    },
};

/**
 *saveFilesToAgentDirectory
 */
exports.saveFilesToAgentDirectory = {

    setUp: function (callback) {
    	try{
            /**
             * Write some files to /tmp
             */
            fs.writeFileSync('/tmp/gebo-server-utils-test-1.txt', 'Word to your mom');
            fs.writeFileSync('/tmp/gebo-server-utils-test-2.txt', 'It\'s Christmas time in Hollis, Queens');
            fs.writeFileSync('/tmp/gebo-server-utils-test-3.txt', 'Yes I eat cow, I am not proud');
            fs.writeFileSync('/tmp/gebo-server-utils-test-4.txt', 'Genesis 9:6');
            callback();
    	}
        catch(e) {
            console.dir(e);
    	}
    },
    
    tearDown: function (callback) {
        fs.removeSync('docs/dan_at_example_dot_com');

        var agentDb = new agentSchema('dan@example.com'); 
        agentDb.connection.on('open', function(err) {
            agentDb.connection.db.dropDatabase(function(err) {
                if (err) {
                  console.log(err);
                }
                agentDb.connection.db.close();
                callback();
              });
          });
    },
};

/**
 * getSafeFileName
 */
exports.getSafeFileName = {

    setUp: function (callback) {
    	try{
            /**
             * Write some files to /tmp
             */
            fs.mkdirsSync('docs/safeFileNameTests');
            fs.writeFileSync('docs/safeFileNameTests/aTestFile.txt', 'Word to your mom');
            fs.writeFileSync('docs/safeFileNameTests/anotherTestFile(5).txt', 'I like to move it move it!');
            fs.writeFileSync('docs/safeFileNameTests/noExtension', 'Bass! How low can you go?');
            fs.writeFileSync('docs/safeFileNameTests/.invisible', 'I live for the applause');
            fs.writeFileSync('docs/safeFileNameTests/alreadySaved.txt', 'Genesis 9:6');
            fs.writeFileSync('docs/safeFileNameTests/alreadySaved(1).txt', 'Genesis 9:6');
            callback();
    	}
        catch(e) {
            console.dir(e);
    	}
    },
    
    tearDown: function (callback) {
        fs.removeSync('docs/safeFileNameTests');
        callback();
    },

    'Return the same file name given if there is no danger of an overwrite': function(test) {
        test.expect(1);
        utils.getSafeFileName('uniqueFilename.txt', 'docs/safeFileNameTests').
            then(function(filename) {
                test.equal(filename, 'uniqueFilename.txt');
                test.done();
              }).
            catch(function(err) {
                test.ok(false, err);    
                test.done();
              });
    },

    'Return the same file name given if the directory doesn\'t exist': function(test) {
        test.expect(1);
        utils.getSafeFileName('uniqueFilename.txt', 'docs/noSuchDirectory').
            then(function(filename) {
                test.equal(filename, 'uniqueFilename.txt');
                test.done();
              }).
            catch(function(err) {
                console.log('err');
                console.log(err);
                test.ok(false, err);    
                test.done();
              });
    },
 
    'Append copy number to end of filename but before file extension': function(test) {
        test.expect(1);
        utils.getSafeFileName('aTestFile.txt', 'docs/safeFileNameTests').
            then(function(filename) {
                test.equal(filename, 'aTestFile(1).txt');
                test.done();
              }).
            catch(function(err) {
                test.ok(false, err);    
                test.done();
              });
    },

    'Append copy number to end of filename without extension': function(test) {
        test.expect(1);
        utils.getSafeFileName('noExtension', 'docs/safeFileNameTests').
            then(function(filename) {
                test.equal(filename, 'noExtension(1)');
                test.done();
              }).
            catch(function(err) {
                test.ok(false, err);    
                test.done();
              });
    },

    'Append copy number to end of hidden file': function(test) {
        test.expect(1);
        utils.getSafeFileName('.invisible', 'docs/safeFileNameTests').
            then(function(filename) {
                test.equal(filename, '.invisible(1)');
                test.done();
              }).
            catch(function(err) {
                test.ok(false, err);    
                test.done();
              });
    },
      
    'Increment existing copy number': function(test) {
        test.expect(1);
        utils.getSafeFileName('anotherTestFile(5).txt', 'docs/safeFileNameTests').
            then(function(filename) {
                test.equal(filename, 'anotherTestFile(6).txt');
                test.done();
              }).
            catch(function(err) {
                test.ok(false, err);    
                test.done();
              });
    },

	'Detect existing duplicates and increment copy number appropriately': function(test) {
        utils.getSafeFileName('alreadySaved.txt', 'docs/safeFileNameTests').
            then(function(filename) {
                test.equal(filename, 'alreadySaved(2).txt');
                test.done();
              }).
            catch(function(err) {
                test.ok(false, err);    
                test.done();
              });
	},
}; 

/**
 * getIndexOfObject
 */
exports.getIndexOfObject = {
    setUp: function (callback) {
        this.array = [
                { key1: 'value1', key2: 'value2' },    
                { key1: 'value3', key2: 'value4' },    
                { key1: 'value5', key2: 'value6' },    
            ];
        callback();
    },
    
    'Return the index of the object matching the given key value pair': function(test) {
        test.expect(6);
        test.equal(utils.getIndexOfObject(this.array, 'key1', 'value1'), 0);
        test.equal(utils.getIndexOfObject(this.array, 'key2', 'value2'), 0);
        test.equal(utils.getIndexOfObject(this.array, 'key1', 'value3'), 1);
        test.equal(utils.getIndexOfObject(this.array, 'key2', 'value4'), 1);
        test.equal(utils.getIndexOfObject(this.array, 'key1', 'value5'), 2);
        test.equal(utils.getIndexOfObject(this.array, 'key2', 'value6'), 2);
        test.done();
    },

    'Return -1 if the objects have no such key': function(test) {
        test.expect(1);
        test.equal(utils.getIndexOfObject(this.array, 'noSuchKey', 'value1'), -1);
        test.done();
    },

    'Return -1 if the objects have no such value': function(test) {
        test.expect(1);
        test.equal(utils.getIndexOfObject(this.array, 'key1', 'noSuchValue'), -1);
        test.done();
    },

    'Return -1 if the objects have no such key-value pair': function(test) {
        test.expect(1);
        test.equal(utils.getIndexOfObject(this.array, 'noSuchKey', 'noSuchValue'), -1);
        test.done();
    },
};

/**
 * getPrivateKeyAndCertificate
 */
exports.getPrivateKeyAndCertificate = {
    'Return a new private key with self-signed certificate': function(test) {
        test.expect(3);
        utils.getPrivateKeyAndCertificate().
            then(function(pair) {
                test.equal(pair.privateKey.search('-----BEGIN RSA PRIVATE KEY-----'), 0);
                // Sometimes it's 475 and sometimes it's 471
                //test.equal(pair.privateKey.search('-----END RSA PRIVATE KEY-----'), 475);
                test.equal(pair.certificate.search('-----BEGIN CERTIFICATE-----'), 0);
                test.equal(pair.certificate.search('-----END CERTIFICATE-----'), 365);
                test.done();
              });
    },
};

/**
 * getOutputFileName
 */
exports.getOutputFileName = {

    'Change the file extension to that specified': function(test) {
        test.expect(2);
        var filename = utils.getOutputFileName('/tmp/gebo-libreoffice/doc.doc', 'pdf');        
        test.equal(filename, 'doc.pdf');
        filename = utils.getOutputFileName('pdf.pdf', 'docx');        
        test.equal(filename, 'pdf.docx');
        test.done();
    },

    'Change the file extension to that specified on an infile with no extension': function(test) {
        test.expect(2);
        var filename = utils.getOutputFileName('/tmp/gebo-libreoffice/doc', 'pdf');        
        test.equal(filename, 'doc.pdf');
        filename = utils.getOutputFileName('pdf.pdf', 'docx');
        test.equal(filename, 'pdf.docx');
        test.done();
    },

    'Change the file extension to that specified on hidden file with no extension': function(test) {
        test.expect(2);
        var filename = utils.getOutputFileName('/tmp/gebo-libreoffice/.hidden', 'pdf');        
        test.equal(filename, '.hidden.pdf');
        filename = utils.getOutputFileName('.hidden', 'docx');        
        test.equal(filename, '.hidden.docx');
        test.done();
    },

    'Change the file extension to that specified on a hidden file with an extension': function(test) {
        test.expect(2);
        var filename = utils.getOutputFileName('/tmp/gebo-libreoffice/.hidden.rtf', 'pdf');        
        test.equal(filename, '.hidden.pdf');
        filename = utils.getOutputFileName('.hidden.pdf', 'docx');        
        test.equal(filename, '.hidden.docx');
        test.done();
    },

    'Should overwrite any unusual extensions': function(test) {
        test.expect(2);
        var filename = utils.getOutputFileName('/tmp/gebo-libreoffice/somefile.someweirdextension', 'rtf');        
        test.equal(filename, 'somefile.rtf');
        filename = utils.getOutputFileName('somefile.someweirdextension', 'docx');        
        test.equal(filename, 'somefile.docx');
        test.done();
    },
};

/**
 * setTimeLimit
 */
var _clock;
exports.setTimeLimit = {

    setUp: function(callback) {
        sinon.stub(childProcess, 'exec', function(cmd, done) {done();});
        _clock = sinon.useFakeTimers();
        callback(); 
    },

    tearDown: function(callback) {
        childProcess.exec.restore();
        _clock.restore();
        callback(); 
    },

    'Kill a long-running process': function(test) {
        test.expect(3);

        // fs.readFile needs to return something, even though no file
        // actually exists
        sinon.stub(fs, 'readFile', function(path, enc, done) {
            done(null, '12345');            
          });

        var options = { timeLimit: 1000, pidFile: 'file.pid' };
        utils.setTimeLimit(options, function(timer) {
            if (!timer) {
              test.ok(false);
            }
            _clock.tick(1000);
            test.ok(childProcess.exec.called);
            test.ok(childProcess.exec.calledWith('kill 12345'));
            test.ok(fs.readFile.called);
    
            fs.readFile.restore();
            test.done();
          });
    },

    'Do nothing and return false if there\'s no PID file on the disk': function(test) {
        test.expect(3);
        sinon.spy(fs, 'readFile');

        var options = { timeLimit: 1000, pidFile: 'file.pid' };
        utils.setTimeLimit(options, function(timer) {
            if (!timer) {
              test.ok(true);
            }
            test.ok(fs.readFile.called);
            test.ok(!childProcess.exec.called);
    
            fs.readFile.restore();
            test.done();
          });
    },

    'Don\'t kill the process if timer is cleared': function(test) {
        test.expect(2);

        // fs.readFile needs to return something, even though no file
        // actually exists
        sinon.stub(fs, 'readFile', function(path, enc, done) {
            done(null, '12345');            
          });

        var options = { timeLimit: 1000, pidFile: 'file.pid' };
        utils.setTimeLimit(options, function(timer) {
            if (!timer) {
              test.ok(false);
            }
            _clock.tick(999);
            clearTimeout(timer);
            _clock.tick(999);
            test.ok(!childProcess.exec.called);
            test.ok(fs.readFile.called);
    
            fs.readFile.restore();
            test.done();
          });
    },

    'Don\'t barf if there\'s no PID specified': function(test) {
        test.expect(3);
        sinon.spy(fs, 'readFile');

        var options = { timeLimit: 1000 };
        utils.setTimeLimit(options, function(timer) {
            if (!timer) {
              test.ok(true);
            }
 
            test.ok(!fs.readFile.called);
            test.ok(!childProcess.exec.called);
    
            fs.readFile.restore();
            test.done();
          });
    },
};


/**
 * getTimeLeft
 */
exports.getTimeLeft = {

    'Return the time remaining on timeoutObject': function(test) {
        test.expect(9);
        var time = 1000;
        var timeout = setTimeout(function() {test.done();}, time);
         
        var interval = setInterval(function() {
            test.ok(utils.getTimeLeft(timeout) <= time);
            time -= 100;

            if (time < 0) {
              clearInterval(interval);
            }
          }, 100);
    },
};


/**
 * stopTimer
 */
exports.stopTimer = {

    'Set options.timeLeft to the time remaining and clear the timer': function(test) {
        test.expect(1);

        var originalTime = 1000;
        var options = { timeLimit: originalTime };

        var timeout = setTimeout(function() {
            test.ok(false, 'This should not fire');
            test.done();
          }, options.timeLimit);

        // This simply ensures that some time actually does ellapse
        setTimeout(function() {
            utils.stopTimer(timeout, options);
            test.ok(options.timeLimit < originalTime);
            test.done();
          }, 10);
    },
};

/**
 * writePidToFile
 */
exports.writePidToFile = {

    'Return an echo-to-file command string if pidFile is provided': function(test) {
        test.expect(1);
        var options = { pidFile: 'someFile.pid' };
        test.equal(utils.echoPidToFile(options), ' & echo $! > someFile.pid');
        test.done();
    },

    'Return an empty string if no pidFile is provided': function(test) {
        test.expect(2);
        var options;
        test.equal(utils.echoPidToFile(options), '');
        options = { some: 'junk' };
        test.equal(utils.echoPidToFile(options), '');
        test.done();
    },

};

/**
 * deleteTmpFiles
 */
exports.deleteTmpFiles = {

    setUp: function(callback) {
        /**
         * Write some files to /tmp
         */
        fs.createReadStream('./test/files/pdf.pdf').pipe(fs.createWriteStream('/tmp/pdf0.pdf'));
        fs.createReadStream('./test/files/pdf.pdf').pipe(fs.createWriteStream('/tmp/pdf1.pdf'));
        fs.createReadStream('./test/files/pdf.pdf').pipe(fs.createWriteStream('/tmp/pdf2.pdf'));
        fs.createReadStream('./test/files/pdf.pdf').pipe(fs.createWriteStream('/tmp/pdf3.pdf'));

        callback();
    },
    
    tearDown: function(callback) {
        callback();
    },

    'Remove a single file from the /tmp directory': function(test) {
        test.expect(1);
        var files = { 
                    file: { 
                        name: 'pdf0.pdf',
                        type: 'application/pdf',
                        path: '/tmp/pdf0.pdf',
                    },
            };
        var count = fs.readdirSync('/tmp').length;
        utils.deleteTmpFiles(files, function(err) {
            if (err) {
              test.ok(false, err);
            }
            test.equal(count - 1, fs.readdirSync('/tmp').length);
            test.done();
          });
    },

    'Remove a multiple files from the /tmp directory': function(test) {
        test.expect(1);
        var files = { 
                    file0: { 
                        name: 'pdf0.pdf',
                        type: 'application/pdf',
                        path: '/tmp/pdf0.pdf',
                    },
                    file1: { 
                        name: 'pdf1.pdf',
                        type: 'application/pdf',
                        path: '/tmp/pdf1.pdf',
                    },
                    file2: { 
                        name: 'pdf2.pdf',
                        type: 'application/pdf',
                        path: '/tmp/pdf2.pdf',
                    },
                    file3: { 
                        name: 'pdf3.pdf',
                        type: 'application/pdf',
                        path: '/tmp/pdf3.pdf',
                    },
            };
        var count = fs.readdirSync('/tmp').length;
        utils.deleteTmpFiles(files, function(err) {
            if (err) {
              test.ok(false, err);
            }
            test.equal(count - 4, fs.readdirSync('/tmp').length);
            test.done();
          });
    },

    'Don\'t barf if an invalid file is passed': function(test) {
        test.expect(2);
        var files = { 
                    file: { 
                        name: 'nosuchfile.pdf',
                        type: 'application/pdf',
                        path: '/tmp/nosuchfile.pdf',
                    },
            };
        var count = fs.readdirSync('/tmp').length;
        utils.deleteTmpFiles(files, function(err) {
            if (err) {
              test.ok(true, err);
            }
            else {
              test.ok(false);
            }
            test.equal(count, fs.readdirSync('/tmp').length);
            test.done();
          });
    },

    'Don\'t barf if no files are passed': function(test) {
        test.expect(1);
        var files = {};
        var count = fs.readdirSync('/tmp').length;
        utils.deleteTmpFiles(files, function(err) {
            if (err) {
              test.ok(false, err);
            }
            test.equal(count, fs.readdirSync('/tmp').length);
            test.done();
          });
    },

    'Don\'t barf if the files parameter is undefined': function(test) {
        test.expect(1);
        var files = undefined;
        var count = fs.readdirSync('/tmp').length;
        utils.deleteTmpFiles(files, function(err) {
            if (err) {
              test.ok(false, err);
            }
            test.equal(count, fs.readdirSync('/tmp').length);
            test.done();
          });
    },
};
