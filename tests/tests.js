/**
 * The order of the tests is very important!
 * Unfortunately using nested describes and beforeAll does not work correctly.
 * So just be careful with the order of tests!
 */

/* eslint-env jasmine */
exports.defineAutoTests = function () {
    /* eslint-disable no-undef */

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 9000;
    var USER_INTERACTION_TIMEOUT = 60 * 1000; // 1 min

    var applicationID_default = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
    var applicationID_custom = 'F5EEDC6C';
    var videoUrl = 'http://s3.nwgat.net/flvplayers3/bbb.mp4';

    describe('chrome.cast', function () {

        var _session = null;
        var _receiverAvailability = [];
        var _sessionUpdatedFired = false;
        var _mediaUpdatedFired = false;
        var _currentMedia;

        it('SPEC_00100 should contain definitions', function () {
            expect(chrome.cast.VERSION).toBeDefined();
            expect(chrome.cast.ReceiverAvailability).toBeDefined();
            expect(chrome.cast.ReceiverType).toBeDefined();
            expect(chrome.cast.SenderPlatform).toBeDefined();
            expect(chrome.cast.AutoJoinPolicy).toBeDefined();
            expect(chrome.cast.Capability).toBeDefined();
            expect(chrome.cast.DefaultActionPolicy).toBeDefined();
            expect(chrome.cast.ErrorCode).toBeDefined();
            expect(chrome.cast.timeout).toBeDefined();
            expect(chrome.cast.isAvailable).toBeDefined();
            expect(chrome.cast.ApiConfig).toBeDefined();
            expect(chrome.cast.Receiver).toBeDefined();
            expect(chrome.cast.DialRequest).toBeDefined();
            expect(chrome.cast.SessionRequest).toBeDefined();
            expect(chrome.cast.Error).toBeDefined();
            expect(chrome.cast.Image).toBeDefined();
            expect(chrome.cast.SenderApplication).toBeDefined();
            expect(chrome.cast.Volume).toBeDefined();
            expect(chrome.cast.media).toBeDefined();
            expect(chrome.cast.initialize).toBeDefined();
            expect(chrome.cast.requestSession).toBeDefined();
            expect(chrome.cast.setCustomReceivers).toBeDefined();
            expect(chrome.cast.Session).toBeDefined();
            expect(chrome.cast.media.PlayerState).toBeDefined();
            expect(chrome.cast.media.ResumeState).toBeDefined();
            expect(chrome.cast.media.MediaCommand).toBeDefined();
            expect(chrome.cast.media.MetadataType).toBeDefined();
            expect(chrome.cast.media.StreamType).toBeDefined();
            expect(chrome.cast.media.timeout).toBeDefined();
            expect(chrome.cast.media.LoadRequest).toBeDefined();
            expect(chrome.cast.media.PlayRequest).toBeDefined();
            expect(chrome.cast.media.SeekRequest).toBeDefined();
            expect(chrome.cast.media.VolumeRequest).toBeDefined();
            expect(chrome.cast.media.StopRequest).toBeDefined();
            expect(chrome.cast.media.PauseRequest).toBeDefined();
            expect(chrome.cast.media.GenericMediaMetadata).toBeDefined();
            expect(chrome.cast.media.MovieMediaMetadata).toBeDefined();
            expect(chrome.cast.media.MusicTrackMediaMetadata).toBeDefined();
            expect(chrome.cast.media.PhotoMediaMetadata).toBeDefined();
            expect(chrome.cast.media.TvShowMediaMetadata).toBeDefined();
            expect(chrome.cast.media.MediaInfo).toBeDefined();
            expect(chrome.cast.media.Media).toBeDefined();
            expect(chrome.cast.Session.prototype.setReceiverVolumeLevel).toBeDefined();
            expect(chrome.cast.Session.prototype.setReceiverMuted).toBeDefined();
            expect(chrome.cast.Session.prototype.stop).toBeDefined();
            expect(chrome.cast.Session.prototype.sendMessage).toBeDefined();
            expect(chrome.cast.Session.prototype.addUpdateListener).toBeDefined();
            expect(chrome.cast.Session.prototype.removeUpdateListener).toBeDefined();
            expect(chrome.cast.Session.prototype.addMessageListener).toBeDefined();
            expect(chrome.cast.Session.prototype.removeMessageListener).toBeDefined();
            expect(chrome.cast.Session.prototype.addMediaListener).toBeDefined();
            expect(chrome.cast.Session.prototype.removeMediaListener).toBeDefined();
            expect(chrome.cast.Session.prototype.loadMedia).toBeDefined();
            expect(chrome.cast.media.Media.prototype.play).toBeDefined();
            expect(chrome.cast.media.Media.prototype.pause).toBeDefined();
            expect(chrome.cast.media.Media.prototype.seek).toBeDefined();
            expect(chrome.cast.media.Media.prototype.stop).toBeDefined();
            expect(chrome.cast.media.Media.prototype.setVolume).toBeDefined();
            expect(chrome.cast.media.Media.prototype.supportsCommand).toBeDefined();
            expect(chrome.cast.media.Media.prototype.getEstimatedTime).toBeDefined();
            expect(chrome.cast.media.Media.prototype.addUpdateListener).toBeDefined();
            expect(chrome.cast.media.Media.prototype.removeUpdateListener).toBeDefined();
        });

        it('SPEC_00200 api should be available', function (done) {
            tryUntilSuccess(function () {
                return chrome.cast.isAvailable;
            }, done);
        });

        describe('Custom Receiver', function () {
            var _customReceiverAvailability = [];

            it('SPEC_00300 initialize should succeed (custom receiver)', function (done) {
                var sessionRequest = new chrome.cast.SessionRequest(applicationID_custom);
                var apiConfig = new chrome.cast.ApiConfig(sessionRequest, function (session) {
                    _session = session;
                }, function (available) {
                    _customReceiverAvailability.push(available);
                });

                chrome.cast.initialize(apiConfig, function () {
                    expect('success').toBeDefined();
                    done();
                }, function (err) {
                    expect(err).toBe(null);
                    done();
                });
            });

            /**
             * Pre-requisite: You must have a valid receiver (chromecast) plugged in and available.
             * You must also be running this test from a project with the package name:
             * com.miloproductionsinc.plugin_tests
             * You can rename your project, or clone this:
             * https://github.com/miloproductionsinc/cordova-testing
             */
            it('SPEC_00310 receiver available (custom receiver)', function (done) {
                tryUntilSuccess(function () {

                    if (_customReceiverAvailability.length >= 1) {
                        // We should see that the receiver is unavailable always first
                        expect(_customReceiverAvailability[0]).toBe(chrome.cast.ReceiverAvailability.UNAVAILABLE);
                        return true;
                    }
                    // We need to return false until the first entry to _receiverAvailability is added
                    return false;

                }, function () {

                    tryUntilSuccess(function () {
                        if (_customReceiverAvailability.length >= 2) {
                            // Then we should receive an available notification
                            expect(_customReceiverAvailability[1]).toBe(chrome.cast.ReceiverAvailability.AVAILABLE);
                            return true;
                        }
                        // We need to return false until the second entry to _receiverAvailability is added
                        return false;

                    }, done);
                });
            }, USER_INTERACTION_TIMEOUT);
        });

        it('SPEC_00400 initialize should succeed (default receiver)', function (done) {
            _receiverAvailability = [];
            var sessionRequest = new chrome.cast.SessionRequest(applicationID_default);
            var apiConfig = new chrome.cast.ApiConfig(sessionRequest, function (session) {
                _session = session;
            }, function (available) {
                _receiverAvailability.push(available);
            });

            chrome.cast.initialize(apiConfig, function () {
                expect('success').toBeDefined();
                done();
            }, function (err) {
                expect(err).toBe(null);
                done();
            });
        });

        /**
         * Pre-requisite: You must have a valid receiver (chromecast) plugged in and available
         */
        it('SPEC_00410 receiver available (default receiver)', function (done) {
            tryUntilSuccess(function () {

                if (_receiverAvailability.length >= 1) {
                    // We should see that the receiver is unavailable always first
                    expect(_receiverAvailability[0]).toBe(chrome.cast.ReceiverAvailability.UNAVAILABLE);
                    return true;
                }
                // We need to return false until the first entry to _receiverAvailability is added
                return false;

            }, function () {

                tryUntilSuccess(function () {
                    if (_receiverAvailability.length >= 2) {
                        // Then we should receive an available notification
                        expect(_receiverAvailability[1]).toBe(chrome.cast.ReceiverAvailability.AVAILABLE);
                        return true;
                    }
                    // We need to return false until the second entry to _receiverAvailability is added
                    return false;

                }, done);
            });
        }, USER_INTERACTION_TIMEOUT);

        it('requestSession should succeed', function (done) {
            chrome.cast.requestSession(function (session) {
                console.log('request session success');
                _session = session;
                expect(session).toBeDefined();
                expect(session.appId).toBeDefined();
                expect(session.displayName).toBeDefined();
                expect(session.receiver).toBeDefined();
                expect(session.receiver.friendlyName).toBeDefined();
                expect(session.addUpdateListener).toBeDefined();
                expect(session.removeUpdateListener).toBeDefined();

                var updateListener = function (isAlive) {
                    _sessionUpdatedFired = true;
                    session.removeUpdateListener(updateListener);
                };

                session.addUpdateListener(updateListener);
                done();
            }, function (err) {
                console.log('request session error');
                expect(err).toBe(null);
                done();
            });
        });

        it('loadRequest should work', function (done) {
            var mediaInfo = new chrome.cast.media.MediaInfo(videoUrl, 'video/mp4');
            var request = new chrome.cast.media.LoadRequest(mediaInfo);
            expect(_session).not.toBeNull();
            _session.loadMedia(request, function (media) {
                console.log('loadRequest success', media);
                _currentMedia = media;
        // expect(_currentMedia instanceof chrome.cast.media.Media).toBe(true);

                expect(_currentMedia.sessionId).toEqual(_session.sessionId);
                expect(_currentMedia.addUpdateListener).toBeDefined();
                expect(_currentMedia.removeUpdateListener).toBeDefined();

                var updateListener = function () {
                    _mediaUpdatedFired = true;
                    _currentMedia.removeUpdateListener(updateListener);
                };

                _currentMedia.addUpdateListener(updateListener);

                done();
            }, function (err) {
                console.log('loadRequest error', err);
                expect(err).toBeNull();
                done();
            });

        });

        it('pause media should succeed', function (done) {
            setTimeout(function () {
                _currentMedia.pause(null, function () {
                    console.log('pause success');
                    done();
                }, function (err) {
                    console.log('pause error', err);
                    expect(err).toBeNull();
                    done();
                });
            }, 5000);
        });

        it('play media should succeed', function (done) {
            setTimeout(function () {
                _currentMedia.play(null, function () {
                    console.log('play success');
                    done();
                }, function (err) {
                    console.log('play error', err);
                    expect(err).toBeNull();
                    done();
                });
            }, 1000);
        });

        it('seek media should succeed', function (done) {
            setTimeout(function () {
                var request = new chrome.cast.media.SeekRequest();
                request.currentTime = 10;

                _currentMedia.seek(request, function () {
                    done();
                }, function (err) {
                    expect(err).toBeNull();
                    done();
                });
            }, 1000);
        });

        it('session updateListener', function (done) {
            expect(_sessionUpdatedFired).toEqual(true);
            done();
        });

        it('media updateListener', function (done) {
            expect(_mediaUpdatedFired).toEqual(true);
            done();
        });

        it('volume and muting', function (done) {
            var volume = new chrome.cast.Volume();
            volume.level = 0.5;

            var request = new chrome.cast.media.VolumeRequest();
            request.volume = volume;

            _currentMedia.setVolume(request, function () {

                var request = new chrome.cast.media.VolumeRequest(new chrome.cast.Volume(null, true));
                _currentMedia.setVolume(request, function () {

                    var request = new chrome.cast.media.VolumeRequest(new chrome.cast.Volume(null, false));
                    _currentMedia.setVolume(request, function () {
                        done();
                    }, function (err) {
                        expect(err).toBeNull();
                        done();
                    });

                }, function (err) {
                    expect(err).toBeNull();
                    done();
                });

            }, function (err) {
                expect(err).toBeNull();
                done();
            });

        });

        it('stopping the video', function (done) {
            _currentMedia.stop(null, function () {
                setTimeout(done, 1000);
            }, function (err) {
                expect(err).toBeNull();
                done();
            });
        });

        it('unloading the session', function (done) {
            _session.stop(function () {
                done();
            }, function (err) {
                expect(err).toBeNull();
                done();
            });
        });

        it('SPEC_01200 should pass auto tests on second run', function () {
            alert('---TEST INSTRUCTION---\nPlease hit "Reset App" at the top and ensure all '
                + 'tests pass again. (This simulates navigation to a new page where the '
                + 'plugin is not loaded from scratch again).');
            expect('succes').toBeDefined();
        });

    });
};

//* *****************************************************************************************
//* ***********************************Helper Functions**************************************
//* *****************************************************************************************

function tryUntilSuccess (successFn, callback, waitBetweenTries) {
    waitBetweenTries = waitBetweenTries || 500;
    if (successFn()) {
        expect(callback).toBeDefined();
        callback();
    } else {
        setTimeout(function () {
            tryUntilSuccess(successFn, callback, waitBetweenTries);
        }, waitBetweenTries);
    }
}
