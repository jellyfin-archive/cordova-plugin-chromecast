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
    var nextTestNum = getTestsPassed();
    var runningTestNum = 0;
    var beforeTimeout;
    var beforeTimeoutMs = 4000;

/* ------------------- Some helper functions ------------------------------ */
    function setNextTestNum (passed) {
        document.cookie = 'nextTestNum=' + passed + ';path=/';
    }
    function getTestsPassed () {
        var name = 'nextTestNum=';
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i].trim();
            if (c.indexOf(name) === 0) {
                try {
                    return parseInt(c.substring(name.length, c.length));
                } catch (err) {
                }
            }
        }
        return 0;
    }
    function setAction (text, btnCallback, btnText) {
        document.getElementById('action-text').innerHTML = text;
        var button = document.getElementById('action-button');
        if (btnCallback) {
            button.style.display = 'block';
            button.onclick = btnCallback;
        } else {
            button.style.display = 'none';
        }
        button.innerHTML = btnText || 'Done';
    }
    function clearAction () {
        setAction('None.');
    }
    // wrap mocha functions so that we can skip previously passed tests
    function wrapMochaFns () {
        var origIt = it;
        window.it = function (title, test) {
            if (test.length < 1) {
                throw new Error('test: "' + title + '" must use the "done" callback');
            }
            origIt(title, function (done) {
                // Should we skip this test?
                if (runningTestNum < nextTestNum) {
                    runningTestNum++;
                    return done();
                }
                test(function (err) {
                    // Test called done
                    if (!err) {
                        // If no error, increment next test num
                        runningTestNum++;
                        setNextTestNum(++nextTestNum);
                    }
                    clearAction();
                    done(err);
                });
            });
        };
        var origBeforeEach = beforeEach;
        function runBeforeEach (name, test, shouldRunFn) {
            if (test.length < 1) {
                throw new Error('beforeEach: must use the "done" callback');
            }
            var stack = new Error().stack.split('\n');
            var timeoutErr = stack[0] + '\nTimeout during: ' + name + '\n';
            while (stack.length > 0 && (stack[0].indexOf('tests_manual') === -1
                || stack[0].match(/^[^(]*before/i))) {
                stack.splice(0, 1);
            }
            timeoutErr += stack.join('\n');
            origBeforeEach(function (done) {
                if (!shouldRunFn()) {
                    // If we should not run the test
                    return done();
                }
                beforeTimeout = setTimeout(function () {
                    assert.fail(timeoutErr);
                }, beforeTimeoutMs);
                test(function () {
                    clearTimeout(beforeTimeout);
                    done();
                });
            });
        }
        window.beforeEach = function (name, test) {
            if (!test) {
                test = name;
                name = '';
            }
            name = 'beforeEach("' + name + '")';
            runBeforeEach(name, test, function () {
                // If we shouldn't skip this test
                return runningTestNum >= nextTestNum;
            });
        };
        window.before = function (name, test) {
            if (!test) {
                test = name;
                name = '';
            }
            name = 'before("' + name + '")';
            var calledBefore = false;
            runBeforeEach(name, test, function () {
                if (!calledBefore && nextTestNum <= runningTestNum) {
                    calledBefore = true;
                    return true;
                }
                return false;
            });
        };
    }

/* ----------------------------- Setup ------------------------------------- */

    window.addEventListener('load', function () {
        document.getElementById('skipped-tests').innerHTML = 'Skipped to test: #'
        + nextTestNum + ' (0-indexed)<br>Click "Re-run" to run tests from the beginning';
        document.getElementById('rerun').onclick = function () {
            setNextTestNum(0);
            window.location.reload();
        };
    });

    // Set the reporter
    mocha.setup({
        bail: true,
        ui: 'bdd',
        useColors: true,
        reporter: window['cordova-plugin-chromecast-tests'].customHtmlReporter,
        slow: 10000,
        timeout: 0
    });

/* ----------------------------- Tests ------------------------------------- */

    describe('cordova-plugin-chromecast', function () {
        wrapMochaFns();

        // callOrder constants that are re-used frequently
        var success = 'success';
        var stopped = 'stopped';

        var session;

        before('Api should be available', function (done) {
            var interval = setInterval(function () {
                if (chrome && chrome.cast && chrome.cast.isAvailable) {
                    clearInterval(interval);
                    done();
                }
            }, 100);
        });

        describe('State: No session automatically discovered', function () {
            before('Initialize should succeed and should not receive a session', function (done) {
                var unavailable = 'unavailable';
                var available = 'available';
                var called = utils.callOrder([
                    { id: success, repeats: false },
                    { id: unavailable, repeats: true },
                    { id: available, repeats: true }
                ], function () {
                    finished = true;
                    // Give it a moment to detect the fail condition
                    // of a session being discovered (so that we don't
                    // start running a test)
                    setTimeout(function () {
                        done();
                    }, 500);
                });
                var finished = false; // Need this so we stop testing after being finished
                var apiConfig = new chrome.cast.ApiConfig(new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID), function sessionListener (session) {
                    assert.fail('should not receive a session (make sure there is no active cast session when starting the tests)');
                }, function receiverListener (availability) {
                    if (!finished) {
                        called(availability);
                    }
                });
                chrome.cast.initialize(apiConfig, function () {
                    called(success);
                }, function (err) {
                    assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                });
            });
            it('chrome.cast.requestSession cancel should return error', function (done) {
                setAction('1. Click "Open Dialog".<br>2. Click outside of the chromecast chooser dialog to <b>dismiss</b> it.', function () {
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
                setAction('1. Click "Open Dialog".<br>2. <b>Select a device</b> in the chromecast chooser dialog.', function () {
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
                setAction('1. Click "Open Dialog".<br>2. Click outside of the stop casting dialog to <b>dismiss</b> it.', function () {
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
                setAction('1. Click "Open Dialog".<br>2. Select "<b>Stop Casting</b>" in the stop casting dialog.'
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
            clearTimeout(beforeTimeout);
            var passed = this.stats.passes === runner.total;
            if (passed) {
                setAction('All tests passed!');
                document.getElementById('action').style.backgroundColor = '#ceffc4';
                setNextTestNum(0);
            }
        });
        return runner;
    };

}());
