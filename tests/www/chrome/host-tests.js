/**
 * Starts a server which serves the content necessary to run the tests on chrome.
 *
 * run:
 * `node ./host-tests.js [<port default=8432>]`
 *
 * Navigate to:
 * `http://localhost:<port>/chrome/tests_chrome.html`
 */
(function () {
    'use strict';

    var path = require('path');
    var express = require('express');

    var _server;
    var _port = 8432;

    // process the passed arguments and configure options
    if (process.argv.length >= 3) {
        _port = process.argv[2];
    }

    _server = express();

    // Add COPIES_DIR first so it is used before the ASSET_DIR
    _server.use('/', express.static(path.resolve(__dirname, '../')));

    // Start the server
    _server.listen(_port, function () {
        console.log('Server listening on port ', _port);
    });

})();
