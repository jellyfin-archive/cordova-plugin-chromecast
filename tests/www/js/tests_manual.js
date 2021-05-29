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
    /* global chrome cordova */

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

    describe('Manual Tests', function () {
        // callOrder constants that are re-used frequently
        var success = 'success';
        var stopped = 'stopped';
        var update = 'update';

        var session;
        var media;

        before('Api should be available and initialize successfully', function (done) {
            this.timeout(15000);
            utils.setAction('Running tests...<br>Please wait for instruction');
            session = null;
            var interval = setInterval(function () {
                if (chrome && chrome.cast && chrome.cast.isAvailable) {
                    clearInterval(interval);
                    done();
                }
            }, 100);
        });

        describe('App restart and reload/change page simulation', function () {
            var cookieName = 'primary-p1_restart-reload';
            var runningNum = parseInt(utils.getValue(cookieName) || '0');
            var mediaInfo;
            var photoItem;
            var assertQueueProperties = function (media) {
                utils.testMediaProperties(media);
                assert.isObject(media.queueData);
                utils.testQueueItems(media.items);
                mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                var i = utils.getCurrentItemIndex(media);
                assert.equal(i, 0);
                mediaUtils.assertMediaInfoItemEquals(media.items[0].media, mediaInfo);
                mediaUtils.assertMediaInfoItemEquals(media.items[1].media, photoItem);
            };
            before('Create MediaInfo', function () {
                mediaInfo = mediaUtils.getMediaInfoItem('VIDEO', chrome.cast.media.MetadataType.GENERIC, new Date(2019, 10, 24));
                photoItem = mediaUtils.getMediaInfoItem('IMAGE', chrome.cast.media.MetadataType.PHOTO, new Date(2020, 10, 31));
            });
            it('Create session', function (done) {
                this.timeout(15000);
                if (runningNum > 0) {
                    // Just pass the test because we need to skip ahead
                    return done();
                }

                // Else, initialize and create the session (Should not receive session on initialize)
                utils.setAction('Initializing...');

                var finished = false; // Need this so we stop testing after being finished
                var failed = false;
                var unavailable = 'unavailable';
                var available = 'available';
                var called = utils.callOrder([
                    { id: success, repeats: false },
                    { id: unavailable, repeats: true },
                    { id: available, repeats: true }
                ], function () {
                    finished = true;
                    // Initialize finished correctly, now create the session
                    utils.setAction('Creating session...');
                    utils.startSession(function (sess) {
                        session = sess;
                        utils.testSessionProperties(sess);
                        if (failed) {
                            // Ensure the session has stopped on failure because
                            // we might not hit this point until after the "after" has already run
                            session.stop();
                        }
                        done();
                    });
                });
                var apiConfig = new chrome.cast.ApiConfig(
                    new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID),
                    function (sess) {
                        failed = true;
                        session = sess;
                        assert.fail('Should not receive session on initialize.  We should only call this initialize when there is no existing session.');
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
            it('session.loadMedia should be able to load a remote video and handle GenericMediaMetadata', function (done) {
                this.timeout(15000);
                if (runningNum > 0) {
                    // Just pass the test because we need to skip ahead
                    return done();
                }
                session.loadMedia(new chrome.cast.media.LoadRequest(mediaInfo), function (m) {
                    media = m;
                    utils.testMediaProperties(media);
                    assert.isUndefined(media.queueData);
                    mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                    media.addUpdateListener(function listener (isAlive) {
                        assert.isTrue(isAlive);
                        utils.testMediaProperties(media);
                        mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                        assert.oneOf(media.playerState, [
                            chrome.cast.media.PlayerState.PLAYING,
                            chrome.cast.media.PlayerState.BUFFERING]);
                        if (media.playerState === chrome.cast.media.PlayerState.PLAYING) {
                            media.removeUpdateListener(listener);
                            utils.storeValue(cookieName, ++runningNum);
                            done();
                        }
                    });
                }, function (err) {
                    assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                });
            });
            it('Reload after session create, should receive session on initialize', function (done) {
                this.timeout(15000);
                var instructionNum = 1;
                var testNum = 2;
                assert.isAtLeast(runningNum, instructionNum, 'Should not be running this test yet');
                switch (runningNum) {
                case instructionNum:
                    // Start the reload
                    utils.setAction('Reloading...');
                    utils.storeValue(cookieName, ++runningNum);
                    window.location.reload();
                    break;
                case testNum:
                    // Test initialize since we just reloaded
                    utils.setAction('Testing reload after session create, should receive session...');
                    var finished = false; // Need this so we stop testing after being finished
                    var unavailable = 'unavailable';
                    var available = 'available';
                    var session_listener = 'session_listener';
                    var called = utils.callOrder([
                            { id: success, repeats: false },
                            { id: unavailable, repeats: true },
                            { id: available, repeats: true },
                            { id: session_listener, repeats: false }
                    ], function () {
                        finished = true;
                        done();
                    });
                    var apiConfig = new chrome.cast.ApiConfig(
                        new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID),
                        function (sess) {
                            session = sess;
                            utils.testSessionProperties(sess);
                            // Ensure the media is maintained
                            assert.isAbove(sess.media.length, 0);
                            media = sess.media[0];
                            assert.isUndefined(media.queueData);
                            mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                            assert.oneOf(media.playerState, [
                                chrome.cast.media.PlayerState.PLAYING,
                                chrome.cast.media.PlayerState.BUFFERING]);
                            called(session_listener);
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
            it('session.queueLoad after page reload should get new media items', function (done) {
                this.timeout(15000);
                var testNum = 2;
                assert.isAtLeast(runningNum, testNum, 'Should not be running this test yet');
                if (runningNum > testNum) {
                    // We must be looking to run a test further down the line
                    return done();
                }
                // Else, run the test

                // Add items to the queue
                var queue = [];
                queue.push(new chrome.cast.media.QueueItem(mediaInfo));
                queue.push(new chrome.cast.media.QueueItem(photoItem));

                // Create request to repeat all and start at last item
                var request = new chrome.cast.media.QueueLoadRequest(queue);
                session.queueLoad(request, function (m) {
                    media = m;
                    console.log(media);
                    assertQueueProperties(media);
                    media.addUpdateListener(function listener (isAlive) {
                        assert.isTrue(isAlive);
                        assertQueueProperties(media);
                        assert.oneOf(media.playerState, [
                            chrome.cast.media.PlayerState.PLAYING,
                            chrome.cast.media.PlayerState.BUFFERING]);
                        if (media.playerState === chrome.cast.media.PlayerState.PLAYING) {
                            media.removeUpdateListener(listener);
                            done();
                        }
                    });
                }, function (err) {
                    assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                });
            });
            it('Pause media from notifications', function (done) {
                this.timeout(15000);
                var testNum = 2;
                assert.isAtLeast(runningNum, testNum, 'Should not be running this test yet');
                if (runningNum > testNum) {
                    // We must be looking to run a test further down the line
                    return done();
                }
                // Else, run the test
                media.addUpdateListener(function listener (isAlive) {
                    assert.isTrue(isAlive);
                    assert.notEqual(media.playerState, chrome.cast.media.PlayerState.IDLE);
                    assertQueueProperties(media);
                    if (media.playerState === chrome.cast.media.PlayerState.PAUSED) {
                        media.removeUpdateListener(listener);
                        utils.storeValue(cookieName, ++runningNum);
                        done();
                    }
                });
                if (!utils.isDesktop() && cordova.platformId === 'android') {
                    utils.setAction('1. Drag down the Android notifications from the top status bar<br>2. Click the <b>pause button</b>',
                    'There is no chromecast notification drop-down', mediaPause);
                } else {
                    mediaPause();
                }
                function mediaPause () {
                    media.pause(null, function () {
                        assert.equal(media.playerState, chrome.cast.media.PlayerState.PAUSED);
                        assertQueueProperties(media);
                    }, function (err) {
                        assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                    });
                }
            });
            it('Restart app with active session, should receive session on initialize', function (done) {
                var instructionNum = 3;
                var testNum = 4;
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
                    utils.setAction('Force kill and restart the app, and navigate back to <b><u>Manual Tests</u></b>.'
                                + '<br>Note: Android 4.4 does not support this feature, so just refresh the page.');
                    break;
                case testNum:
                    this.timeout(15000);
                    // Test initialize since we just reloaded
                    utils.setAction('Testing initialize after app restart, should receive a session...');
                    var finished = false; // Need this so we stop testing after being finished
                    var unavailable = 'unavailable';
                    var available = 'available';
                    var session_listener = 'session_listener';
                    var called = utils.callOrder([
                            { id: success, repeats: false },
                            { id: unavailable, repeats: true },
                            { id: available, repeats: true },
                            { id: session_listener, repeats: false }
                    ], function () {
                        finished = true;
                        done();
                    });
                    var apiConfig = new chrome.cast.ApiConfig(
                            new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID),
                            function (sess) {
                                session = sess;
                                utils.testSessionProperties(sess);
                                // Ensure the media is maintained
                                media = sess.media[0];
                                assertQueueProperties(media);
                                assert.equal(media.playerState, chrome.cast.media.PlayerState.PAUSED);
                                called(session_listener);
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
            it('media.play should resume playback', function (done) {
                this.timeout(15000);
                var testNum = 4;
                assert.isAtLeast(runningNum, testNum, 'Should not be running this test yet');
                if (runningNum > testNum) {
                    // We must be looking to run a test further down the line
                    return done();
                }
                // Else, run the test

                var called = utils.waitForAllCalls([
                    { id: success, repeats: false },
                    { id: update, repeats: true }
                ], function () {
                    utils.storeValue(cookieName, ++runningNum);
                    done();
                });
                media.addUpdateListener(function listener (isAlive) {
                    assert.isTrue(isAlive);
                    assert.notEqual(media.playerState, chrome.cast.media.PlayerState.IDLE);
                    mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                    if (media.playerState === chrome.cast.media.PlayerState.PLAYING) {
                        media.removeUpdateListener(listener);
                        called(update);
                    }
                });
                media.play(null, function () {
                    assert.oneOf(media.playerState, [
                        chrome.cast.media.PlayerState.PLAYING,
                        chrome.cast.media.PlayerState.BUFFERING]);
                    mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                    called(success);
                }, function (err) {
                    assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                });
            });
            it('Reload after app restart, should receive session on initialize', function (done) {
                this.timeout(15000);
                var instructionNum = 5;
                var testNum = 6;
                assert.isAtLeast(runningNum, instructionNum, 'Should not be running this test yet');
                switch (runningNum) {
                case instructionNum:
                    // Start the reload
                    utils.setAction('Reloading...');
                    utils.storeValue(cookieName, ++runningNum);
                    window.location.reload();
                    break;
                case testNum:
                    // Test initialize since we just reloaded
                    utils.setAction('Testing reload after app restart, should receive a session...');
                    var finished = false; // Need this so we stop testing after being finished
                    var unavailable = 'unavailable';
                    var available = 'available';
                    var session_listener = 'session_listener';
                    var called = utils.callOrder([
                            { id: success, repeats: false },
                            { id: unavailable, repeats: true },
                            { id: available, repeats: true },
                            { id: session_listener, repeats: false }
                    ], function () {
                        finished = true;
                        utils.storeValue(cookieName, ++runningNum);
                        done();
                    });
                    var apiConfig = new chrome.cast.ApiConfig(
                            new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID),
                            function (sess) {
                                session = sess;
                                utils.testSessionProperties(sess);
                                // Ensure the media is maintained
                                media = session.media[0];
                                assertQueueProperties(media);
                                assert.equal(media.playerState, chrome.cast.media.PlayerState.PLAYING);
                                called(session_listener);
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
            it('Stop session from notifications (android)', function (done) {
                session.addUpdateListener(function listener (isAlive) {
                    if (session.status === chrome.cast.SessionStatus.STOPPED) {
                        assert.isFalse(isAlive);
                        session.removeUpdateListener(listener);
                        session = null;
                        done();
                    }
                });
                if (!utils.isDesktop() && cordova.platformId === 'android') {
                    utils.setAction('1. Drag down the Android notifications from the top status bar<br>2. Click the "<b>X</b>"',
                    'There is no chromecast notification drop-down', sessionStop);
                } else {
                    sessionStop();
                }
                function sessionStop () {
                    session.stop(function () {
                    }, function (err) {
                        assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                    });
                }
            });
            after('Ensure session is stopped', function (done) {
                // Reset tests
                utils.storeValue(cookieName, 0);
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
                var called = utils.waitForAllCalls([
                    { id: stopped, repeats: true },
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
                    + (utils.isDesktop() ? '<br>3. Click outside of the stop casting dialog to <b>dismiss</b> it.' : ''),
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

    });

}());
