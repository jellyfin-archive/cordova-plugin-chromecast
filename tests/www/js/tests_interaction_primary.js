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
            this.timeout(15000);
            session = null;
            var interval = setInterval(function () {
                if (chrome && chrome.cast && chrome.cast.isAvailable) {
                    clearInterval(interval);
                    done();
                }
            }, 100);
        });
        describe('App restart and reload/change page simulation', function () {
            var cookieName = 'primary-p2_restart-reload';
            var runningNum = parseInt(utils.getValue(cookieName) || '0');
            it('Should not receive a session on initialize after a page change', function (done) {
                this.timeout(15000);
                if (runningNum > 0) {
                    // Just pass the test because we need to skip ahead
                    return done();
                }
                utils.setAction('Checking for session after page load, (should not find session)...');
                var finished = false; // Need this so we stop testing after being finished
                var unavailable = 'unavailable';
                var available = 'available';
                var called = utils.callOrder([
                    { id: success, repeats: false },
                    { id: unavailable, repeats: true },
                    { id: available, repeats: true }
                ], function () {
                    finished = true;
                    // Give it an extra moment to check for the session
                    setTimeout(function () {
                        utils.storeValue(cookieName, ++runningNum);
                        done();
                    }, 1000);
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
            it('Should not receive a session on initialize after app restart', function (done) {
                var instructionNum = 1;
                var testNum = 2;
                assert.isAtLeast(runningNum, instructionNum, 'Should not be running this test yet');
                switch (runningNum) {
                case instructionNum:
                    // Show instructions for app restart
                    utils.storeValue(cookieName, testNum);
                    if (isDesktop) {
                        // If desktop, just reload the page (because restart doesn't work)
                        window.location.reload();
                    }
                    this.timeout(0); // no timeout
                    utils.setAction('Force kill and restart the app, and navigate back to <b><u>Manual Tests (Primary) Part 2</u></b>.'
                                + '<br>Note: Android 4.4 does not support this feature, so just refresh the page.');
                    break;
                case testNum:
                    this.timeout(15000);
                    // Test initialize since we just reloaded
                    utils.setAction('Checking for session after app restart, (should not find session)...');
                    var finished = false; // Need this so we stop testing after being finished
                    var unavailable = 'unavailable';
                    var available = 'available';
                    var called = utils.callOrder([
                        { id: success, repeats: false },
                        { id: unavailable, repeats: true },
                        { id: available, repeats: true }
                    ], function () {
                        finished = true;
                        // Give it an extra moment to check for the session
                        setTimeout(function () {
                            utils.storeValue(cookieName, ++runningNum);
                            done();
                        }, 1000);
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
                    break;
                default:
                    // We must be looking to run a test further down the line
                    return done();
                }
            });
            after(function () {
                // Reset tests
                utils.storeValue(cookieName, 0);
            });
        });
        describe('session interaction with secondary', function () {
            it('Create session', function (done) {
                utils.setAction('On <u>secondary</u> click "<b>Start Part 2</b>".',
                'Enter Session' + (isDesktop ? '<br>(On desktop, you must stop & start casting from the same cast pop up)' : ''), function () {
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
                utils.setAction('All manual tests passed! [Assuming you did Part 1 as well :) ]');
                document.getElementById('action').style.backgroundColor = '#ceffc4';
            }
        });
        return runner;
    };

}());
