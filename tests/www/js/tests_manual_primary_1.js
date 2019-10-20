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

    describe('Manual Tests - Primary Device - Part 1', function () {
        var videoUrl = 'https://ia801302.us.archive.org/1/items/TheWater_201510/TheWater.mp4';
        var audioUrl = 'https://ia600304.us.archive.org/20/items/OTRR_Gunsmoke_Singles/Gunsmoke_52-10-03_024_Cain.mp3';

        // callOrder constants that are re-used frequently
        var success = 'success';
        var stopped = 'stopped';
        var update = 'update';

        var session;
        var media;

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
                        if (!finished) {
                            assert.fail('got session before "success", "unavailable", "available" sequence completed');
                        }
                        session = sess;
                        utils.testSessionProperties(sess);
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
            }
        });

        // Must be the first test
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
                    + '&nbsp;&nbsp;&nbsp;&nbsp;1. Wait for session discovery. (Fails if none found after 15s)<br>',
                    'Start Session',
                    function () {
                        clearInterval(interval);
                        utils.startSession(function (sess) {
                            session = sess;
                            if (isDesktop) {
                                utils.setAction('1. Refresh this page.');
                            } else {
                                utils.setAction('1. Force kill and restart the app.'
                                + '<br>*Android 4.4 does not support this feature, so just refresh the page.');
                            }
                        });
                    }
                );
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

        describe('chrome.cast.requestSession', function () {
            it('dismiss should return error', function (done) {
                utils.setAction('1. Click "Open Dialog".<br>2. Click outside of the chromecast chooser dialog to <b>dismiss</b> it.', 'Open Dialog', function () {
                    chrome.cast.requestSession(function (sess) {
                        session = sess;
                        assert.fail('We should not reach here on dismiss (make sure you cancelled the dialog for this test!)');
                    }, function (err) {
                        assert.isObject(err);
                        assert.equal(err.code, chrome.cast.ErrorCode.CANCEL);
                        done();
                    });
                });
            });
            it('success should return a session', function (done) {
                utils.setAction('1. Click "Open Dialog".<br>2. <b>Select a device</b> in the chromecast chooser dialog.', 'Open Dialog', function () {
                    chrome.cast.requestSession(function (sess) {
                        session = sess;
                        utils.testSessionProperties(session);
                        done();
                    }, function (err) {
                        assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                    });
                });
            });
            it('(stop casting) cancel should return error', function (done) {
                utils.setAction('1. Click "Open Dialog".<br>2. Click outside of the stop casting dialog to <b>dismiss</b> it.', 'Open Dialog', function () {
                    chrome.cast.requestSession(function (session) {
                        assert.fail('We should not reach here on dismiss (make sure you cancelled the dialog for this test!)');
                    }, function (err) {
                        assert.isObject(err);
                        assert.equal(err.code, chrome.cast.ErrorCode.CANCEL);
                        done();
                    });
                });
            });
            it('(stop casting) clicking "Stop Casting" should stop the session', function (done) {
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
                    'Open Dialog',
                    function () {
                        chrome.cast.requestSession(function (session) {
                            assert.fail('We should not reach here on stop casting');
                        }, function (err) {
                            assert.isObject(err);
                            assert.equal(err.code, chrome.cast.ErrorCode.CANCEL);
                            called(success);
                        });
                    }
                );
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

        describe('External Sender Sends Commands', function () {
            before(function () {
                assert.equal(session.status, chrome.cast.SessionStatus.STOPPED);
            });
            it('Join external session', function (done) {
                if (isDesktop) {
                    // This is a hack because desktop chrome is incapable of
                    // joining a session.  So we have to create the session
                    // from chrome first and then join from the app.
                    return utils.startSession(function (sess) {
                        session = sess;
                        showInstructions(done);
                    });
                }
                // Else
                showInstructions(function () {
                    utils.startSession(function (sess) {
                        session = sess;
                        utils.testSessionProperties(session);
                        done();
                    });
                });
                function showInstructions (callback) {
                    utils.setAction('Ensure you have only 1 physical chromecast device on your network (castGroups are fine).<br>'
                        + '<br>1. On a <u>secondary</u> device (or desktop chrome browser),'
                        + ' navigate to <b><u>Manual Tests (Secondary)</u></b><br>'
                        + '2. Follow instructions on <u>secondary</u> app.',
                        'Continue',
                        function () {
                            callback();
                        });
                }

            });
            it('External loadMedia should trigger mediaListener', function (done) {
                utils.setAction('On <u>secondary</u> click "<b>Load Media</b>"');
                var finished = false;
                session.addMediaListener(function listener (m) {
                    if (finished) {
                        return;
                    }
                    utils.setAction('Tests running...');
                    media = m;
                    var interval = setInterval(function () {
                        if (media.media.tracks != null && media.media.tracks !== undefined) {
                            clearInterval(interval);
                            utils.testMediaProperties(media);
                            finished = true;
                            done();
                        }
                    }, 400);
                });
            });
            it('External media stop should trigger media updateListener', function (done) {
                utils.setAction('On <u>secondary</u> click "<b>Stop Media</b>"');
                media.addUpdateListener(function listener (isAlive) {
                    if (media.playerState === chrome.cast.media.PlayerState.IDLE) {
                        media.removeUpdateListener(listener);
                        assert.equal(media.idleReason, chrome.cast.media.IdleReason.CANCELLED);
                        assert.isFalse(isAlive);
                        done();
                    }
                });
            });
            it('External queueLoad should trigger mediaListener', function (done) {
                utils.setAction('On <u>secondary</u> click "<b>Load Queue</b>"');
                var finished = false;
                session.addMediaListener(function listener (m) {
                    if (finished) {
                        return;
                    }
                    finished = true;
                    media = m;
                    var interval = setInterval(function () {
                        if (media.currentItemId > -1 && media.media.tracks) {
                            clearInterval(interval);
                            finished = true;
                            utils.testMediaProperties(media);
                            var items = media.items;
                            var startTime = 40;
                            assert.isTrue(items[0].autoplay);
                            assert.equal(items[0].startTime, startTime);
                            assert.equal(items[0].media.contentId, videoUrl);
                            assert.isTrue(items[1].autoplay);
                            assert.equal(items[1].startTime, startTime * 2);
                            assert.equal(items[1].media.contentId, audioUrl);
                            done();
                        }
                    }, 400);
                });
            });
            it('Jump to different queue item should trigger media.addUpdateListener and not session.addMediaListener', function (done) {
                utils.setAction('On <u>secondary</u> click "<b>Queue Jump</b>"');
                var called = utils.callOrder([
                    { id: stopped, repeats: true },
                    { id: update, repeats: true }
                ], done);
                var currentItemId = media.currentItemId;
                var mediaListener = function (media) {
                    assert.fail('session.addMediaListener should only be called when an external sender loads media. '
                        + '(We are the one loading.  We are not external to ourself.');
                };
                session.addMediaListener(mediaListener);
                media.addUpdateListener(function listener (isAlive) {
                    assert.isTrue(isAlive);
                    if (media.playerState === chrome.cast.media.PlayerState.IDLE) {
                        assert.oneOf(media.idleReason,
                            [chrome.cast.media.IdleReason.INTERRUPTED, chrome.cast.media.IdleReason.FINISHED]);
                        called(stopped);
                    }
                    if (media.currentItemId !== currentItemId) {
                        session.removeMediaListener(mediaListener);
                        media.removeUpdateListener(listener);
                        utils.testMediaProperties(media);
                        called(update);
                    }
                });
            });
            it('session.leave should leave the session', function (done) {
                utils.setAction('Follow instructions on <u>secondary</u>.', 'Leave Session', function () {
                    // Set up the expected calls
                    var called = utils.callOrder([
                        { id: success, repeats: false },
                        { id: update, repeats: true }
                    ], function () {
                        done();
                    });
                    var finished = false;
                    session.addUpdateListener(function listener (isAlive) {
                        if (finished) {
                            return;
                        }
                        assert.isTrue(isAlive);
                        if (session.status === chrome.cast.SessionStatus.DISCONNECTED) {
                            finished = true;
                            called(update);
                        }
                    });
                    session.leave(function () {
                        called(success);
                    }, function (err) {
                        assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                    });
                });
            });
            after('Ensure we have left the session', function (done) {
                if (!session) {
                    return done();
                }
                session.leave(function () {
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
                utils.setAction('1. On <u>secondary</u>, click "<b>Check Session</b>"<br>Then follow directions on <u>secondary</u>!');
                document.getElementById('action').style.backgroundColor = '#ceffc4';
            }
        });
        return runner;
    };

}());
