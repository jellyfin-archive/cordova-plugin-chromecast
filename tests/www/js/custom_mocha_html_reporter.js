/**
 * Dependencies:
 * - Load after the mocha scrip has been loaded.
 */
(function () {
    'use strict';
    /* eslint-env mocha */

    // Save htmlReporter reference
    var htmlReporter = mocha._reporter;

    // Create a custom reporter so that we can console log errors
    // with linking to source for quick debugging in dev tools
    var myReporter = function (runner, options) {
        // Add the error listener
        runner.on('fail', function (test, err) {
            // Need to add the full code location path
            // so that the debugger can link to it

            // get the prepend path
            var prependPath = window.location.href.split('/');
            prependPath.pop();
            prependPath = prependPath.join('/') + '/';

            var lines = (err.stack || err.message || err).split('\n');
            var line, filePath;
            for (var i = 1; i < lines.length; i++) {
                line = lines[i];
                // Make sure the line fits the format of a line with a code link
                if (line.match(/^ *at .* \([^(]*\)$/)) {
                    line = line.split('(');
                    filePath = line[line.length - 1];
                    // Does the path need pre-pending?
                    if (filePath.indexOf('://') === -1) {
                        // Insert the full path to the file
                        line[line.length - 1] = prependPath + filePath;
                        // Rejoin the line
                        lines[i] = line.join('(');
                    }
                }
            }
            // Log the error
            console.error(lines.join('\n'));
        });
        // And return the default HTML reporter
        htmlReporter.call(this, runner, options);
    };
    myReporter.prototype = htmlReporter.prototype;

    window['cordova-plugin-chromecast-tests'] = window['cordova-plugin-chromecast-tests'] || {};
    window['cordova-plugin-chromecast-tests'].customHtmlReporter = myReporter;
}());
