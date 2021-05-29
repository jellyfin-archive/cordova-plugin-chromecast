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

    describe('Manual Tests - Secondary Device', function () {
        // callOrder constants that are re-used frequently
        var success = 'success';
        var stopped = 'stopped';
        var update = 'update';
        var newMedia = 'newMedia';

        var session;
        var media;

        var startTime = 40;
        var videoItem;
        var audioItem;

        var checkItems = function (items) {
            assert.isTrue(items[0].autoplay);
            assert.equal(items[0].startTime, startTime);
            mediaUtils.assertMediaInfoItemEquals(items[0].media, videoItem);
            assert.isTrue(items[1].autoplay);
            assert.equal(items[1].startTime, startTime * 2);
            mediaUtils.assertMediaInfoItemEquals(items[1].media, audioItem);
        };

        before('setup constants', function () {
            // This must be identical to the before('setup constants'.. in tests_interaction_primary.js
            videoItem = mediaUtils.getMediaInfoItem('VIDEO', chrome.cast.media.MetadataType.TV_SHOW, new Date(2020, 10, 31));
            audioItem = mediaUtils.getMediaInfoItem('AUDIO', chrome.cast.media.MetadataType.MUSIC_TRACK, new Date(2020, 10, 31));
            // TODO desktop chrome does not send all metadata attributes for some reason,
            // So delete the metadata so that assertMediaInfoEquals does not compare it
            videoItem.metadata = null;
            audioItem.metadata = null;
        });
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
                        assert.fail('should not receive a session (make sure there is no active cast session when starting the tests)');
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
        it('Create session', function (done) {
            assert.notExists(session);
            utils.startSession(function (sess) {
                session = sess;
                session.addMediaListener(function (media) {
                    assert.fail('session.addMediaListener should only be called when an external sender loads media. '
                        + '(We are the one loading.  We are not external to ourself.');
                });
                done();
            });
        });
        it('session.loadMedia should be able to load a remote video', function (done) {
            utils.setAction('On <u>primary</u> click "<b>Listen for External Load Media</b>"', 'Load Media', function () {
                session.loadMedia(new chrome.cast.media.LoadRequest(videoItem), function (m) {
                    media = m;
                    utils.testMediaProperties(media);
                    assert.isUndefined(media.queueData);
                    mediaUtils.assertMediaInfoItemEquals(media.media, videoItem);
                    media.addUpdateListener(function listener (isAlive) {
                        assert.isTrue(isAlive);
                        utils.testMediaProperties(media);
                        mediaUtils.assertMediaInfoItemEquals(media.media, videoItem);
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
        });
        it('media.stop should end video playback', function (done) {
            utils.setAction('Wait for instructions from <u>primary</u>.', 'Stop Media', function () {
                var called = utils.waitForAllCalls([
                    { id: success, repeats: false },
                    { id: update, repeats: true }
                ], function () {
                    done();
                });
                media.addUpdateListener(function listener (isAlive) {
                    mediaUtils.assertMediaInfoItemEquals(media.media, videoItem);
                    if (media.playerState === chrome.cast.media.PlayerState.IDLE) {
                        media.removeUpdateListener(listener);
                        assert.equal(media.idleReason, chrome.cast.media.IdleReason.CANCELLED);
                        assert.isFalse(isAlive);
                        called(update);
                    }
                });
                media.stop(null, function () {
                    mediaUtils.assertMediaInfoItemEquals(media.media, videoItem);
                    assert.equal(media.playerState, chrome.cast.media.PlayerState.IDLE);
                    assert.equal(media.idleReason, chrome.cast.media.IdleReason.CANCELLED);
                    called(success);
                }, function (err) {
                    assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                });
            });
        });
        it('session.queueLoad should be able to load remote audio/video queue and return the correct Metadata', function (done) {
            utils.setAction('Wait for instructions from <u>primary</u>.', 'Load Queue', function () {
                var item;
                var queue = [];

                // Add items to the queue
                item = new chrome.cast.media.QueueItem(videoItem);
                item.startTime = startTime;
                queue.push(item);
                item = new chrome.cast.media.QueueItem(audioItem);
                item.startTime = startTime * 2;
                queue.push(item);

                // Create request to repeat all and start at 2nd item
                var request = new chrome.cast.media.QueueLoadRequest(queue);
                request.repeatMode = chrome.cast.media.RepeatMode.ALL;
                request.startIndex = 1;

                session.queueLoad(request, function (m) {
                    media = m;
                    var i = utils.getCurrentItemIndex(media);
                    utils.testMediaProperties(media);
                    assert.equal(media.currentItemId, media.items[i].itemId);
                    assert.equal(media.repeatMode, chrome.cast.media.RepeatMode.ALL);
                    assert.isObject(media.queueData);
                    assert.equal(media.queueData.repeatMode, request.repeatMode);
                    assert.isFalse(media.queueData.shuffle);
                    assert.equal(media.queueData.startIndex, request.startIndex);
                    utils.testQueueItems(media.items);
                    mediaUtils.assertMediaInfoItemEquals(media.media, audioItem);
                    assert.equal(media.items.length, 2);
                    checkItems(media.items);
                    mediaUtils.assertMediaInfoItemEquals(media.items[i].media, audioItem);
                    media.addUpdateListener(function listener (isAlive) {
                        assert.isTrue(isAlive);
                        utils.testMediaProperties(media);
                        mediaUtils.assertMediaInfoItemEquals(media.media, audioItem);
                        assert.oneOf(media.playerState, [
                            chrome.cast.media.PlayerState.PLAYING,
                            chrome.cast.media.PlayerState.BUFFERING]);
                        if (media.playerState === chrome.cast.media.PlayerState.PLAYING) {
                            media.removeUpdateListener(listener);
                            assert.closeTo(media.getEstimatedTime(), startTime * 2, 5);
                            done();
                        }
                    });
                }, function (err) {
                    assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                });
            });
        });
        it('media.queueJumpToItem should jump to selected item', function (done) {
            utils.setAction('Wait for instructions from <u>primary</u>.', 'Queue Jump', function () {
                var calledAnyOrder = utils.waitForAllCalls([
                    { id: success, repeats: false },
                    { id: update, repeats: true }
                ], function () {
                    done();
                });
                var calledOrder = utils.callOrder([
                    { id: stopped, repeats: true },
                    { id: newMedia, repeats: true }
                ], function () {
                    calledAnyOrder(update);
                });
                var i = utils.getCurrentItemIndex(media);
                media.addUpdateListener(function listener (isAlive) {
                    if (media.playerState === chrome.cast.media.PlayerState.IDLE) {
                        assert.oneOf(media.idleReason,
                            [chrome.cast.media.IdleReason.INTERRUPTED, chrome.cast.media.IdleReason.FINISHED]);
                        assert.isTrue(isAlive);
                        calledOrder(stopped);
                    }
                    if (media.currentItemId !== media.items[i].itemId) {
                        i = utils.getCurrentItemIndex(media);
                        media.removeUpdateListener(listener);
                        utils.testMediaProperties(media);
                        assert.equal(media.currentItemId, media.items[i].itemId);
                        utils.testQueueItems(media.items);
                        mediaUtils.assertMediaInfoItemEquals(media.media, videoItem);
                        assert.equal(media.items.length, 2);
                        checkItems(media.items);
                        mediaUtils.assertMediaInfoItemEquals(media.media, videoItem);
                        assert.closeTo(media.getEstimatedTime(), startTime, 5);
                        calledOrder(newMedia);
                    }
                });
                // Jump
                var jumpIndex = (i + 1) % media.items.length;
                media.queueJumpToItem(media.items[jumpIndex].itemId, function () {
                    calledAnyOrder(success);
                }, function (err) {
                    assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                });
            });
        });
        it('Primary session.leave', function (done) {
            utils.setAction('On <u>primary</u>, click "<b>Leave Session</b>"', 'Check Session', function () {
                assert.equal(session.status, chrome.cast.SessionStatus.CONNECTED);
                done();
            });
        });
        it('Primary should not receive session on initialize', function (done) {
            this.timeout(240000);
            utils.setAction('1. On <u><b>primary</b></u>, click "<b>Page Reload</b>".'
                + '<br>2. Wait for instructions from <u><b>primary</b></u>.', 'Leave Session', done);
        });
        it('Secondary session.leave should cause session to end (because all senders have left)', function (done) {
            var called = utils.waitForAllCalls([
                { id: success, repeats: false },
                { id: update, repeats: true }
            ], done);
            session.addUpdateListener(function listener (isAlive) {
                if (session.status === chrome.cast.SessionStatus.DISCONNECTED) {
                    assert.isTrue(isAlive);
                    session.removeUpdateListener(listener);
                    called(update);
                }
            });
            session.leave(function () {
                called(success);
            }, function (err) {
                assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
            });
        });
        it('Join session', function (done) {
            if (utils.isDesktop()) {
                // This is a hack because desktop chrome is incapable of
                // joining a session.  So we have to create the session
                // from chrome first and then join from the app.
                utils.startSession(function (sess) {
                    session = sess;
                    utils.setAction('1. On <u>primary</u> click "<b>Enter Session</b>"<br>2. Wait for instructions from <u>primary</u>.', 'Join/Start Session', done);
                });
                return;
            }
            utils.setAction('On <u>primary</u> click "<b>Enter Session</b>"', 'Join/Start Session', function () {
                utils.startSession(function (sess) {
                    session = sess;
                    done();
                });
            });
        });
        it('session.stop', function (done) {
            var called = utils.waitForAllCalls([
                { id: success, repeats: false },
                { id: update, repeats: true }
            ], done);
            session.addUpdateListener(function listener (isAlive) {
                if (session.status === chrome.cast.SessionStatus.STOPPED) {
                    assert.isFalse(isAlive);
                    session.removeUpdateListener(listener);
                    called(update);
                }
            });
            session.stop(function () {
                called(success);
            }, function (err) {
                assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
            });
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

    window['cordova-plugin-chromecast-tests'] = window['cordova-plugin-chromecast-tests'] || {};
    window['cordova-plugin-chromecast-tests'].runMocha = function () {
        var runner = mocha.run();
        runner.on('suite end', function (suite) {
            var passed = this.stats.passes === runner.total;
            if (passed) {
                utils.setAction('All Manual Tests (Secondary) passed!');
                document.getElementById('action').style.backgroundColor = '#ceffc4';
            }
        });
        return runner;
    };

}());
