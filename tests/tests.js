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
    var videoUrl = location.origin + '/res/test.mp4';

    describe('chrome.cast', function () {

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
            _session = 'no_session';
            var sessionRequest = new chrome.cast.SessionRequest(applicationID_default);
            var apiConfig = new chrome.cast.ApiConfig(sessionRequest, function (session) {
                _session = session;
            }, function (available) {
                _receiverAvailability.push(available);
            });

            chrome.cast.initialize(apiConfig, function () {
                expect('success').toBeTruthy();
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

        describe('Everything Session', function () {

            it('SPEC_01000 Test valid session', function (done) {
                alert('---TEST INSTRUCTION---\nPlease select a valid chromecast in the next dialog.');

                function handleErr (err) {
                    console.error(err);
                    console.log(new Error().stack);
                    expect(err).toEqual('Should not have gotten an error at all');
                    done();
                }

                chrome.cast.requestSession(function (session) {

                    // // Run all the session related tests
                    Promise.resolve(session)
                    .then(sessionProperties)
                    .then(loadMedia)
                    .then(stopSession)
                    .then(done)
                    .catch(handleErr);

                }, handleErr);
            }, USER_INTERACTION_TIMEOUT);

            function sessionProperties (session) {
                return new Promise(function (resolve, reject) {
                    expect(session instanceof chrome.cast.Session).toBeTruthy();
                    expect(session.appId).toBeDefined();
                    expect(session.displayName).toBeDefined();
                    expect(session.receiver).toBeDefined();
                    expect(session.receiver.friendlyName).toBeDefined();
                    expect(session.addUpdateListener).toBeDefined();
                    expect(session.removeUpdateListener).toBeDefined();
                    expect(session.loadMedia).toBeDefined();

                    resolve(session);
                });
            }

            function loadMedia (session) {
                return new Promise(function (resolve, reject) {
                    var mediaInfo = new chrome.cast.media.MediaInfo(videoUrl, 'video/mp4');
                    expect(mediaInfo).toBeTruthy();

                    var request = new chrome.cast.media.LoadRequest(mediaInfo);
                    expect(request).toBeTruthy();

                    session.loadMedia(request, function (media) {

                        // Run all the media related tests
                        Promise.resolve({media: media, session: session})
                        .then(mediaProperties)
                        .then(pauseSuccess)
                        .then(playSuccess)
                        .then(seekSuccess)
                        .then(setVolumeSuccess)
                        .then(muteVolumeSuccess)
                        .then(unmuteVolumeSuccess)
                        .then(stopSuccess)
                        .then(function (media) {
                            resolve(session);
                        })
                        .catch(reject);

                    }, reject);
                });
            }

            function mediaProperties (data) {
                return new Promise(function (resolve, reject) {
                    var media = data.media;
                    var session = data.session;
                    expect(media instanceof chrome.cast.media.Media).toBeTruthy();
                    expect(media.sessionId).toEqual(session.sessionId);
                    expect(media.addUpdateListener).toBeDefined();
                    expect(media.removeUpdateListener).toBeDefined();
                    resolve(media);
                });
            }

            function pauseSuccess (media) {
                return new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        media.pause(null, function () {
                            resolve(media);
                        }, reject);
                    }, 500);
                });
            }

            function playSuccess (media) {
                return new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        media.play(null, function () {
                            resolve(media);
                        }, reject);
                    }, 500);
                });
            }

            function seekSuccess (media) {
                return new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        var request = new chrome.cast.media.SeekRequest();
                        request.currentTime = 3;
                        media.seek(request, function () {
                            resolve(media);
                        }, reject);
                    }, 500);
                });
            }

            function setVolumeSuccess (media) {
                return new Promise(function (resolve, reject) {
                    var volume = new chrome.cast.Volume();
                    volume.level = 0.2;

                    var request = new chrome.cast.media.VolumeRequest();
                    request.volume = volume;

                    media.setVolume(request, function () {
                        resolve(media);
                    }, reject);
                });
            }

            function muteVolumeSuccess (media) {
                return new Promise(function (resolve, reject) {
                    var request = new chrome.cast.media.VolumeRequest(new chrome.cast.Volume(null, true));
                    media.setVolume(request, function () {
                        resolve(media);
                    }, reject);
                });
            }

            function unmuteVolumeSuccess (media) {
                return new Promise(function (resolve, reject) {
                    var request = new chrome.cast.media.VolumeRequest(new chrome.cast.Volume(null, false));
                    media.setVolume(request, function () {
                        resolve(media);
                    }, reject);
                });
            }

            function stopSuccess (media) {
                return new Promise(function (resolve, reject) {
                    media.stop(null, function () {
                        resolve(media);
                    }, reject);
                });
            }

            function stopSession (session) {
                return new Promise(function (resolve, reject) {
                    session.stop(function () {
                        resolve(session);
                    }, reject);
                });
            }

        });

        it('SPEC_01200 should pass auto tests on second run', function () {
            alert('---TEST INSTRUCTION---\nPlease hit "Reset App" at the top and ensure all '
                + 'tests pass again. (This simulates navigation to a new page where the '
                + 'plugin is not loaded from scratch again).');
            expect('success').toBeDefined();
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
