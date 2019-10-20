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

    describe('Manual Tests - Secondary Device', function () {
        var imageUrl = 'https://ia800705.us.archive.org/1/items/GoodHousekeeping193810/Good%20Housekeeping%201938-10.jpg';
        var videoUrl = 'https://ia801302.us.archive.org/1/items/TheWater_201510/TheWater.mp4';
        var audioUrl = 'https://ia600304.us.archive.org/20/items/OTRR_Gunsmoke_Singles/Gunsmoke_52-10-03_024_Cain.mp3';

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
            assert.equal(items[0].media.contentId, videoUrl);
            assert.isTrue(items[1].autoplay);
            assert.equal(items[1].startTime, startTime * 2);
            assert.equal(items[1].media.contentId, audioUrl);
        };

        before('setup constants', function () {
            videoItem = new chrome.cast.media.MediaInfo(videoUrl, 'video/mp4');
            videoItem.metadata = new chrome.cast.media.TvShowMediaMetadata();
            videoItem.metadata.title = 'DaTitle';
            videoItem.metadata.subtitle = 'DaSubtitle';
            videoItem.metadata.originalAirDate = new Date().valueOf();
            videoItem.metadata.episode = 15;
            videoItem.metadata.season = 2;
            videoItem.metadata.seriesTitle = 'DaSeries';
            videoItem.metadata.images = [new chrome.cast.Image(imageUrl)];

            audioItem = new chrome.cast.media.MediaInfo(audioUrl, 'audio/mpeg');
            audioItem.metadata = new chrome.cast.media.MusicTrackMediaMetadata();
            audioItem.metadata.albumArtist = 'DaAlmbumArtist';
            audioItem.metadata.albumName = 'DaAlbum';
            audioItem.metadata.artist = 'DaArtist';
            audioItem.metadata.composer = 'DaComposer';
            audioItem.metadata.title = 'DaTitle';
            audioItem.metadata.songName = 'DaSongName';
            audioItem.metadata.myMadeUpMetadata = '15';
            audioItem.metadata.releaseDate = new Date().valueOf();
            audioItem.metadata.images = [new chrome.cast.Image(imageUrl)];
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
        it('session.loadMedia should be able to load a remote video and handle GenericMediaMetadata', function (done) {
            utils.setAction('On <u>primary</u> click "<b>Continue</b>"', 'Load Media', function () {
                var mediaInfo = new chrome.cast.media.MediaInfo(videoUrl, 'video/mp4');
                mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
                mediaInfo.metadata.title = 'DaTitle';
                mediaInfo.metadata.subtitle = 'DaSubtitle';
                mediaInfo.metadata.releaseDate = new Date().valueOf();
                mediaInfo.metadata.someTrueBoolean = true;
                mediaInfo.metadata.someFalseBoolean = false;
                mediaInfo.metadata.someSmallNumber = 15;
                mediaInfo.metadata.someLargeNumber = 1234567890123456;
                mediaInfo.metadata.someSmallDecimal = 15.15;
                mediaInfo.metadata.someLargeDecimal = 1234567.123456789;
                mediaInfo.metadata.someString = 'SomeString';
                mediaInfo.metadata.images = [new chrome.cast.Image(imageUrl)];
                session.loadMedia(new chrome.cast.media.LoadRequest(mediaInfo), function (m) {
                    media = m;
                    utils.testMediaProperties(media);
                    assert.isUndefined(media.queueData);
                    assert.equal(media.media.metadata.title, mediaInfo.metadata.title);
                    assert.equal(media.media.metadata.subtitle, mediaInfo.metadata.subtitle);
                    assert.equal(media.media.metadata.releaseDate, mediaInfo.metadata.releaseDate);
                        // TODO figure out how to maintain the data types for custom params on the native side
                        // so that we don't have to do turn each actual and expected into a string
                    assert.equal(media.media.metadata.someTrueBoolean + '', mediaInfo.metadata.someTrueBoolean + '');
                    assert.equal(media.media.metadata.someFalseBoolean + '', mediaInfo.metadata.someFalseBoolean + '');
                    assert.equal(media.media.metadata.someSmallNumber + '', mediaInfo.metadata.someSmallNumber + '');
                    assert.equal(media.media.metadata.someLargeNumber + '', mediaInfo.metadata.someLargeNumber + '');
                    assert.equal(media.media.metadata.someSmallDecimal + '', mediaInfo.metadata.someSmallDecimal + '');
                    assert.equal(media.media.metadata.someLargeDecimal + '', mediaInfo.metadata.someLargeDecimal + '');
                    assert.equal(media.media.metadata.someString, mediaInfo.metadata.someString);
                    assert.equal(media.media.metadata.images[0].url, mediaInfo.metadata.images[0].url);
                    assert.equal(media.media.metadata.metadataType, chrome.cast.media.MetadataType.GENERIC);
                    assert.equal(media.media.metadata.type, chrome.cast.media.MetadataType.GENERIC);
                    media.addUpdateListener(function listener (isAlive) {
                        assert.isTrue(isAlive);
                        utils.testMediaProperties(media);
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
            utils.setAction('', 'Stop Media', function () {
                var called = utils.waitForAllCalls([
                        { id: success, repeats: false },
                        { id: update, repeats: true }
                ], function () {
                    done();
                });
                media.addUpdateListener(function listener (isAlive) {
                    if (media.playerState === chrome.cast.media.PlayerState.IDLE) {
                        media.removeUpdateListener(listener);
                        assert.equal(media.idleReason, chrome.cast.media.IdleReason.CANCELLED);
                        assert.isFalse(isAlive);
                        called(update);
                    }
                });
                media.stop(null, function () {
                    assert.equal(media.playerState, chrome.cast.media.PlayerState.IDLE);
                    assert.equal(media.idleReason, chrome.cast.media.IdleReason.CANCELLED);
                    called(success);
                }, function (err) {
                    assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                });
            });
        });
        it('session.queueLoad should be able to load remote audio/video queue and return the correct Metadata', function (done) {
            utils.setAction('', 'Load Queue', function () {
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
                    assert.equal(media.media.contentId, audioUrl);
                    assert.equal(media.items.length, 2);
                    checkItems(media.items);
                    assert.equal(media.items[i].media.metadata.albumArtist, audioItem.metadata.albumArtist);
                    assert.equal(media.items[i].media.metadata.albumName, audioItem.metadata.albumName);
                    assert.equal(media.items[i].media.metadata.artist, audioItem.metadata.artist);
                    assert.equal(media.items[i].media.metadata.composer, audioItem.metadata.composer);
                    assert.equal(media.items[i].media.metadata.title, audioItem.metadata.title);
                    assert.equal(media.items[i].media.metadata.songName, audioItem.metadata.songName);
                    assert.equal(media.items[i].media.metadata.releaseDate, audioItem.metadata.releaseDate);
                    assert.equal(media.items[i].media.metadata.images[0].url, audioItem.metadata.images[0].url);
                    assert.equal(media.items[i].media.metadata.myMadeUpMetadata, audioItem.metadata.myMadeUpMetadata);
                    assert.equal(media.items[i].media.metadata.metadataType, chrome.cast.media.MetadataType.MUSIC_TRACK);
                    assert.equal(media.items[i].media.metadata.type, chrome.cast.media.MetadataType.MUSIC_TRACK);
                    media.addUpdateListener(function listener (isAlive) {
                        assert.isTrue(isAlive);
                        utils.testMediaProperties(media);
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
            utils.setAction('', 'Queue Jump', function () {
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
                    if (media.currentItemId !== media.items[i].itemId && media.media.contentId === videoUrl) {
                        i = utils.getCurrentItemIndex(media);
                        media.removeUpdateListener(listener);
                        utils.testMediaProperties(media);
                        assert.equal(media.currentItemId, media.items[i].itemId);
                        utils.testQueueItems(media.items);
                        assert.equal(media.media.contentId, videoUrl);
                        assert.equal(media.items.length, 2);
                        checkItems(media.items);
                        assert.equal(media.items[i].media.contentId, videoUrl);
                        assert.equal(media.items[i].media.metadata.title, videoItem.metadata.title);
                        assert.equal(media.items[i].media.metadata.subtitle, videoItem.metadata.subtitle);
                        assert.equal(media.items[i].media.metadata.originalAirDate, videoItem.metadata.originalAirDate);
                        assert.equal(media.items[i].media.metadata.episode, videoItem.metadata.episode);
                        assert.equal(media.items[i].media.metadata.season, videoItem.metadata.season);
                        assert.equal(media.items[i].media.metadata.seriesTitle, videoItem.metadata.seriesTitle);
                        assert.equal(media.items[i].media.metadata.images[0].url, videoItem.metadata.images[0].url);
                        assert.equal(media.items[i].media.metadata.metadataType, chrome.cast.media.MetadataType.TV_SHOW);
                        assert.equal(media.items[i].media.metadata.type, chrome.cast.media.MetadataType.TV_SHOW);
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
            utils.setAction('On <u><b>primary</b></u>:<br>1. Force kill and restart the app.'
             + '<br>2. Select <b><u>Manual Tests (Primary) Part 2</u></b> from the home page to finish the manual tests.', 'Start Part 2', done);
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
            if (isDesktop) {
                // This is a hack because desktop chrome is incapable of
                // joining a session.  So we have to create the session
                // from chrome first and then join from the app.
                utils.startSession(function (sess) {
                    session = sess;
                    utils.setAction('On <u>primary</u> click "<b>Enter Session</b>', 'Continue', done);
                });
                return;
            }
            utils.setAction('On <u>primary</u> click "<b>Enter Session</b>', 'Continue', function () {
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
