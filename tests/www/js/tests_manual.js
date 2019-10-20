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
        timeout: 0
    });

    describe('cordova-plugin-chromecast', function () {
        // callOrder constants that are re-used frequently
        var success = 'success';
        var stopped = 'stopped';
        var update = 'update';

        var session;
        var sessionListener = function (sess) { };

        before('Api should be available and initialize successfully', function (done) {
            session = null;
            var interval = setInterval(function () {
                if (chrome && chrome.cast && chrome.cast.isAvailable) {
                    clearInterval(interval);
                    initializeApi();
                }
            }, 100);
            function initializeApi () {
                var finished = false; // Need this so we stop testing after being finished
                sessionListener = function (sess) {
                    if (!finished) {
                        assert.fail('got session before "success", "unavailable", "available" sequence completed');
                    }
                    utils.testSessionProperties(sess);
                    session = sess;
                };
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
                    sessionListener,
                    function receiverListener (availability) {
                        if (!finished) {
                            called(availability);
                        }
                    }, chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED);
                chrome.cast.initialize(apiConfig, function () {
                    called(success);
                }, function (err) {
                    assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                });
            }
        });

        describe('App restart', function () {
            it('Restart app with active session, should receive session on initialize', function (done) {
                var interval;
                var time = 15000;
                interval = setInterval(function () {
                    time -= 500;
                    if (session) {
                        clearInterval(interval);
                        done();
                    }
                    if (time < 0) {
                        clearInterval(interval);
                        assert.fail('Failed to find session for 15s after app restart.  '
                        + 'Make sure that a session started by this device is active during app restart.');
                    }
                }, 500);
                utils.setAction('<u>Situation #1</u> - First time you have reached the "restart app" test:<br>'
                    + '&nbsp;&nbsp;&nbsp;&nbsp;1. Click "<b>Start Session</b>"<br><br>'
                    + '<u>Situation #2</u> - You have force killed and restarted the app:<br>'
                    + '&nbsp;&nbsp;&nbsp;&nbsp;1. Wait for session discovery. (Fails if none found after 15s)<br>', function () {
                    clearInterval(interval);
                    utils.startSession(function (sess) {
                        session = sess;
                        if (isDesktop) {
                            utils.setAction('1. Open a new tab and visit this url.');
                        } else {
                            utils.setAction('1. Force kill and restart the app.');
                        }
                    });
                }, 'Start Session');
            });
            after('Ensure session is stopped', function (done) {
                session.stop(function () {
                    session = null;
                    done();
                }, function () {
                    done();
                });
            });
        });

        describe('State: No session automatically discovered', function () {
            before(function () {
                assert.notExists(session);
            });
            it('chrome.cast.requestSession cancel should return error', function (done) {
                utils.setAction('1. Click "Open Dialog".<br>2. Click outside of the chromecast chooser dialog to <b>dismiss</b> it.', function () {
                    chrome.cast.requestSession(function (sess) {
                        session = sess;
                        assert.fail('We should not reach here on dismiss (make sure you cancelled the dialog for this test!)');
                    }, function (err) {
                        assert.isObject(err);
                        assert.equal(err.code, chrome.cast.ErrorCode.CANCEL);
                        done();
                    });
                }, 'Open Dialog');
            });
            it('chrome.cast.requestSession success should return a session', function (done) {
                utils.setAction('1. Click "Open Dialog".<br>2. <b>Select a device</b> in the chromecast chooser dialog.', function () {
                    chrome.cast.requestSession(function (sess) {
                        session = sess;
                        utils.testSessionProperties(session);
                        done();
                    }, function (err) {
                        assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                    });
                }, 'Open Dialog');
            });
            it('chrome.cast.requestSession (stop casting) cancel should return error', function (done) {
                utils.setAction('1. Click "Open Dialog".<br>2. Click outside of the stop casting dialog to <b>dismiss</b> it.', function () {
                    chrome.cast.requestSession(function (session) {
                        assert.fail('We should not reach here on dismiss (make sure you cancelled the dialog for this test!)');
                    }, function (err) {
                        assert.isObject(err);
                        assert.equal(err.code, chrome.cast.ErrorCode.CANCEL);
                        done();
                    });
                }, 'Open Dialog');
            });
            it('chrome.cast.requestSession (stop casting) clicking "Stop Casting" should stop the session', function (done) {
                var called = utils.callOrder([
                    { id: stopped, repeats: false },
                    { id: success, repeats: false }
                ], done);
                session.addUpdateListener(function listener (isAlive) {
                    if (session.status === chrome.cast.SessionStatus.STOPPED) {
                        session.removeUpdateListener(listener);
                        assert.isFalse(isAlive);
                        called(stopped);
                    }
                });
                utils.setAction('1. Click "Open Dialog".<br>2. Select "<b>Stop Casting</b>" in the stop casting dialog.'
                + (isDesktop ? '<br>3. Click outside of the stop casting dialog to <b>dismiss</b> it.' : ''),
                function () {
                    chrome.cast.requestSession(function (session) {
                        assert.fail('We should not reach here on stop casting');
                    }, function (err) {
                        assert.isObject(err);
                        assert.equal(err.code, chrome.cast.ErrorCode.CANCEL);
                        called(success);
                    });
                }, 'Open Dialog');
            });
            after('Ensure session is stopped', function (done) {
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

    });

    window['cordova-plugin-chromecast-tests'] = window['cordova-plugin-chromecast-tests'] || {};
    window['cordova-plugin-chromecast-tests'].runMocha = function () {
        var runner = mocha.run();
        runner.on('suite end', function (suite) {
            var passed = this.stats.passes === runner.total;
            if (passed) {
                utils.setAction('All tests passed!');
                document.getElementById('action').style.backgroundColor = '#ceffc4';
                setNextTestNum(0);
            }
        });
        return runner;
    };

}());
