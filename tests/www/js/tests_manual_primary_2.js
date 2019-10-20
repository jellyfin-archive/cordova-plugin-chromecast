/**
 * The order of these tests and this.bail(true) is very important.
 *
 * Rather than nesting deep with describes and before's we just ensure the
 * tests occur in the correct order.
 * The major advantage to this is not having to repeat test code frequently
 * making the suite slow.
 *
 */

(function () {
    'use strict';
    /* eslint-env mocha */
    /* global chrome */

    var assert = window.chai.assert;
    var utils = window['cordova-plugin-chromecast-tests'].utils;
    var isDesktop = window['cordova-plugin-chromecast-tests'].isDesktop || false;

    mocha.setup({
        bail: true,
        ui: 'bdd',
        useColors: true,
        reporter: window['cordova-plugin-chromecast-tests'].customHtmlReporter,
        slow: 10000,
        timeout: 180000
    });

    describe('Manual Tests - Primary Device - Part 2', function () {
        // callOrder constants that are re-used frequently
        var success = 'success';
        var session;

        before('Api should be available and initialize successfully', function (done) {
            session = null;
            var interval = setInterval(function () {
                if (chrome && chrome.cast && chrome.cast.isAvailable) {
                    clearInterval(interval);
                    done();
                }
            }, 100);
        });
        it('Should not receive a session on initialize', function (done) {
            var finished = false; // Need this so we stop testing after being finished
            var unavailable = 'unavailable';
            var available = 'available';
            var called = utils.callOrder([
                { id: success, repeats: false },
                { id: unavailable, repeats: true },
                { id: available, repeats: true }
            ], function () {
                finished = true;
                done();
            });
            var apiConfig = new chrome.cast.ApiConfig(
                new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID),
                function (sess) {
                    session = sess;
                    if (!isDesktop) {
                        assert.fail('should not receive a session (make sure there is no active cast session when starting the tests)');
                    }
                }, function receiverListener (availability) {
                    if (!finished) {
                        called(availability);
                    }
                }, chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED);
            chrome.cast.initialize(apiConfig, function () {
                called(success);
            }, function (err) {
                assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
            });
        });
        it('Create session', function (done) {
            utils.setAction('On <u>secondary</u> click "<b>Start Part 2</b>".', 'Enter Session', function () {
                utils.startSession(function (sess) {
                    session = sess;
                    utils.testSessionProperties(session);
                    utils.setAction('On <u>secondary</u> click "<b>Continue</b>".');
                    done();
                });
            });
        });
        it('External session.stop should kill this session as well', function (done) {
            session.addUpdateListener(function listener (isAlive) {
                if (session.status === chrome.cast.SessionStatus.STOPPED) {
                    assert.isFalse(isAlive);
                    session.removeUpdateListener(listener);
                    done();
                }
            });
        });
        after('Ensure we have stopped the session', function (done) {
            if (!session) {
                return done();
            }
            session.stop(function () {
                done();
            }, function () {
                done();
            });
        });

    });

    window['cordova-plugin-chromecast-tests'] = window['cordova-plugin-chromecast-tests'] || {};
    window['cordova-plugin-chromecast-tests'].runMocha = function () {
        var runner = mocha.run();
        runner.on('suite end', function (suite) {
            var passed = this.stats.passes === runner.total;
            if (passed) {
                utils.setAction('All manual tests passed! (Assuming you did Part 1 as well)');
                document.getElementById('action').style.backgroundColor = '#ceffc4';
            }
        });
        return runner;
    };

}());
