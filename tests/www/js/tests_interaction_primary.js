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
    var mediaUtils = window['cordova-plugin-chromecast-tests'].mediaUtils;

    mocha.setup({
        bail: true,
        ui: 'bdd',
        useColors: true,
        reporter: window['cordova-plugin-chromecast-tests'].customHtmlReporter,
        slow: 10000,
        timeout: 180000
    });

    describe('Interaction Tests - Primary Device', function () {
        // callOrder constants that are re-used frequently
        var success = 'success';
        var stopped = 'stopped';
        var update = 'update';

        var session;
        var media;
        var videoItem;
        var audioItem;

        var cookieName = 'primary-p2_restart-reload';
        var runningNum = parseInt(utils.getValue(cookieName) || '-1');

        before('setup constants', function () {
            // This must be identical to the before('setup constants'.. in tests_interaction_secondary.js
            videoItem = mediaUtils.getMediaInfoItem('VIDEO', chrome.cast.media.MetadataType.TV_SHOW, new Date(2020, 10, 31));
            audioItem = mediaUtils.getMediaInfoItem('AUDIO', chrome.cast.media.MetadataType.MUSIC_TRACK, new Date(2020, 10, 31));
            // TODO desktop chrome does not send all metadata attributes for some reason,
            // So delete the metadata so that assertMediaInfoEquals does not compare it
            videoItem.metadata = null;
            audioItem.metadata = null;
        });
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
        describe('External Sender Sends Commands', function () {
            before('already passed all tests in this section', function () {
                // Have we already passed the tests in this describe and should skip?
                if (runningNum > -1) {
                    this.skip();
                }
            });
            before('ensure initialized', function (done) {
                this.timeout(15000);
                utils.setAction('Initializing...');

                var finished = false; // Need this so we stop testing after being finished
                var available = 'available';
                var called = utils.callOrder([
                    { id: success, repeats: false },
                    { id: available, repeats: true }
                ], function () {
                    finished = true;
                    if (session) {
                        assert.equal(session.status, chrome.cast.SessionStatus.STOPPED);
                    }
                    done();
                });
                var apiConfig = new chrome.cast.ApiConfig(
                    new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID),
                    function (sess) {
                        session = sess;
                        assert.fail('Should not receive session on initialize.  We should only call this initialize when there is no existing session.');
                    }, function receiverListener (availability) {
                        if (!finished && availability === available) {
                            called(availability);
                        }
                    }, chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED);
                chrome.cast.initialize(apiConfig, function () {
                    called(success);
                }, function (err) {
                    assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                });
            });
            it('Join external session', function (done) {
                if (utils.isDesktop()) {
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
                        + ' navigate to <b><u>Interaction Tests - Secondary Device</u></b><br>'
                        + '2. Follow instructions on <u>secondary</u> device.',
                        'Listen for External Load Media',
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
                    utils.testMediaProperties(media);
                    mediaUtils.assertMediaInfoItemEquals(media.media, videoItem);
                    finished = true;
                    done();
                });
            });
            it('External media stop should trigger media updateListener', function (done) {
                utils.setAction('On <u>secondary</u> click "<b>Stop Media</b>"');
                media.addUpdateListener(function listener (isAlive) {
                    mediaUtils.assertMediaInfoItemEquals(media.media, videoItem);
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
                    mediaUtils.assertMediaInfoItemEquals(media.media, audioItem);
                    var interval = setInterval(function () {
                        if (media.currentItemId > -1) {
                            clearInterval(interval);
                            finished = true;
                            utils.testMediaProperties(media);
                            var items = media.items;
                            var startTime = 40;
                            assert.isTrue(items[0].autoplay);
                            assert.equal(items[0].startTime, startTime);
                            mediaUtils.assertMediaInfoItemEquals(items[0].media, videoItem);
                            assert.isTrue(items[1].autoplay);
                            assert.equal(items[1].startTime, startTime * 2);
                            mediaUtils.assertMediaInfoItemEquals(items[1].media, audioItem);
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
                        mediaUtils.assertMediaInfoItemEquals(media.media, videoItem);
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
                        utils.setAction('1. On <u>secondary</u>, click "<b>Check Session</b>"<br>'
                        + '2. Then follow directions on <u>secondary</u>!', 'Page Reload', function () {
                            utils.storeValue(cookieName, 0);
                            window.location.href = window.location.href;
                            done();
                        });
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
        describe('App restart and reload/change page simulation', function () {
            it('Should not receive a session on initialize after a page change', function (done) {
                this.timeout(15000);
                if (runningNum > 0) {
                    // Just pass the test because we need to skip ahead
                    return done();
                }
                utils.setAction('Checking for session after page load, (should not find session)...');
                var finished = false; // Need this so we stop testing after being finished
                var available = 'available';
                var called = utils.callOrder([
                    { id: success, repeats: false },
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
                        if (!utils.isDesktop()) {
                            assert.fail('should not receive a session (make sure there is no active cast session when starting the tests)');
                        }
                    }, function receiverListener (availability) {
                        if (!finished && availability === available) {
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
                    if (utils.isDesktop()) {
                        // If desktop, just reload the page (because restart doesn't work)
                        window.location.reload();
                    }
                    this.timeout(0); // no timeout
                    utils.setAction('Force kill and restart the app, and navigate back to <b><u>Interaction Tests - Primary Device</u></b>.'
                                + '<br>Note: Android 4.4 does not support this feature, so just refresh the page.');
                    break;
                case testNum:
                    this.timeout(15000);
                    // Test initialize since we just reloaded
                    utils.setAction('Checking for session after app restart, (should not find session)...');
                    var finished = false; // Need this so we stop testing after being finished
                    var available = 'available';
                    var called = utils.callOrder([
                        { id: success, repeats: false },
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
                            if (!utils.isDesktop()) {
                                assert.fail('should not receive a session (make sure there is no active cast session when starting the tests)');
                            }
                        }, function receiverListener (availability) {
                            if (!finished && availability === available) {
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
                // Reset runningNum as we are done with it
                utils.clearStoredValues();
            });
        });
        describe('session interaction with secondary', function () {
            it('Create session', function (done) {
                utils.setAction('On <u>secondary</u> click "<b>Leave Session</b>".',
                'Enter Session'
                + (utils.isDesktop() ? '<br>(Desktop: Stop & Start casting from the same cast pop up)' : ''),
                function () {
                    utils.startSession(function (sess) {
                        session = sess;
                        utils.testSessionProperties(session);
                        utils.setAction('On <u>secondary</u> click "<b>Join/Start Session</b>".');
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

}());
