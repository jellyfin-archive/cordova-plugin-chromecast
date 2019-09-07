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
    var videoUrl = location.origin + '/plugins/cordova-plugin-chromecast-tests/res/test.mp4';

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
            var interval = setInterval(function () {
                if (chrome.cast.isAvailable) {
                    expect(chrome.cast.isAvailable).toEqual(true);
                    clearInterval(interval);
                    done();
                }
            }, 500);
        });

        it('SPEC_00300 initialize should succeed (custom receiver)', function (done) {
            var sessionRequest = new chrome.cast.SessionRequest(applicationID_custom);
            var apiConfig = new chrome.cast.ApiConfig(sessionRequest, function (session) {}, function (available) {});
            chrome.cast.initialize(apiConfig, function () {
                expect('success').toBeDefined();
                done();
            }, function (err) {
                fail(err.code + ': ' + err.description);
                done();
            });
        });

        /**
         * Pre-requisite: You must have a valid receiver (chromecast) plugged in and available.
         */
        it('SPEC_00400 initialize should succeed (default receiver)', function (done) {
            var step = 1;
            var sessionRequest = new chrome.cast.SessionRequest(applicationID_default);
            var apiConfig = new chrome.cast.ApiConfig(sessionRequest, function (session) {
                fail('should not receive a session (make sure there is no active cast session when starting the tests)');
            }, function receiverListener (available) {
                if (step === 1) {
                    fail('SPEC_00400 - Did not hit initialize Step 1 first');
                }
                if (step === 2) {
                    // Step 2 - We must get the unavailable notification
                    if (available !== 'unavailable') {
                        fail('SPEC_00400 - Step 2 - Hit receiver listener with non-unavailable status');
                    } else {
                        step++;
                    }
                }
                if (step === 3) {
                    // Step 3 - We are allowed to receive multiple unavailable until we receive the first available in this step
                    if (available !== 'unavailable' && available !== 'available') {
                        fail('SPEC_00400 - Step 3 - Hit receiver listener with incorrect status');
                    }
                    if (available === 'available') {
                        expect('success').toBeDefined();
                        done();
                    }
                }
            });
            chrome.cast.initialize(apiConfig, function () {
                // Step 1
                if (step !== 1) {
                    fail('SPEC_00400 - Step 1 - Expected to hit this first, but did not');
                }
                step++;
            }, function (err) {
                fail(err.code + ': ' + err.description);
                done();
            });
        });

        it('requestSession click outside of dialog should return the cancel error', function (done) {
            alert('---TEST INSTRUCTION---\nPlease click outside of the next dialog to dismiss it.');
            chrome.cast.requestSession(function (session) {
                fail('We should not reach here on dismiss (make sure you cancelled the dialog for this test!)');
                done();
            }, function (err) {
                expect(err instanceof chrome.cast.Error).toBeTruthy();
                expect(err.code).toBe(chrome.cast.ErrorCode.CANCEL);
                done();
            });
        }, USER_INTERACTION_TIMEOUT);

        describe('Everything Session', function () {

            it('SPEC_01000 Test valid session', function (done) {
                alert('---TEST INSTRUCTION---\nPlease select a valid chromecast in the next dialog.');

                chrome.cast.requestSession(function (session) {

                    // Run all the session related tests
                    Promise.resolve(session)
                    .then(sessionProperties)
                    .then(newPageSharesSession)
                    .then(sessionProperties)
                    .then(loadMedia)
                    .then(stopSession)
                    .then(done);

                }, function (err) {
                    fail(err.code + ': ' + err.description);
                    done();
                });

            }, USER_INTERACTION_TIMEOUT);

            /**
             * When on a new page, it will call initialize again
             * This should result in the session being passed to the
             * session listener as long as teh requested appId does
             * not change.
             */
            function newPageSharesSession (session) {
                return new Promise(function (resolve) {
                    var step = 1;
                    var sessionRequest = new window.chrome.cast.SessionRequest(window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
                    var apiConfig = new window.chrome.cast.ApiConfig(sessionRequest, function (session) {
                        if (step !== 4) {
                            fail('newPageSharesSession.js - Did not hit session listener as 4th step');
                        }
                        resolve(session);
                    }, function receiverListener (available) {
                        if (step === 1) {
                            fail('newPageSharesSession.js - Did not hit initialize Step 1 first');
                        }
                        if (step === 2) {
                            // Step 2 - We must get the unavailable notification
                            if (available !== 'unavailable') {
                                fail('newPageSharesSession.js - Step 2 - Hit receiver listener with non-unavailable status');
                            } else {
                                step++;
                            }
                        }
                        if (step === 3) {
                            // Step 3 - We are allowed to receive multiple unavailable until we receive the first available in this step
                            if (available !== 'unavailable' && available !== 'available') {
                                fail('newPageSharesSession.js - Step 3 - Hit receiver listener with incorrect status');
                            }
                            if (available === 'available') {
                                step++;
                            }
                        }
                    });

                    // Initialize
                    window.chrome.cast.initialize(apiConfig, function () {
                        // Step 1
                        if (step !== 1) {
                            fail('newPageSharesSession.js - Step 1 - Expected to hit this first, but did not');
                        }
                        step++;
                    }, function (err) {
                        fail(err.code + ': ' + err.description);
                    });
                });
            }

            function sessionProperties (session) {
                return new Promise(function (resolve) {
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
                return new Promise(function (resolve) {
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
                        });

                    }, function (err) {
                        fail(err.code + ': ' + err.description);
                        resolve();
                    });
                });
            }

            function mediaProperties (data) {
                return new Promise(function (resolve) {
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
                return new Promise(function (resolve) {
                    setTimeout(function () {
                        media.pause(null, function () {
                            resolve(media);
                        }, function (err) {
                            fail(err.code + ': ' + err.description);
                            resolve();
                        });
                    }, 500);
                });
            }

            function playSuccess (media) {
                return new Promise(function (resolve) {
                    setTimeout(function () {
                        media.play(null, function () {
                            resolve(media);
                        }, function (err) {
                            fail(err.code + ': ' + err.description);
                            resolve();
                        });
                    }, 500);
                });
            }

            function seekSuccess (media) {
                return new Promise(function (resolve) {
                    setTimeout(function () {
                        var request = new chrome.cast.media.SeekRequest();
                        request.currentTime = 3;
                        media.seek(request, function () {
                            resolve(media);
                        }, function (err) {
                            fail(err.code + ': ' + err.description);
                            resolve();
                        });
                    }, 500);
                });
            }

            function setVolumeSuccess (media) {
                return new Promise(function (resolve) {
                    var volume = new chrome.cast.Volume();
                    volume.level = 0.2;

                    var request = new chrome.cast.media.VolumeRequest();
                    request.volume = volume;

                    media.setVolume(request, function () {
                        resolve(media);
                    }, function (err) {
                        fail(err.code + ': ' + err.description);
                        resolve();
                    });
                });
            }

            function muteVolumeSuccess (media) {
                return new Promise(function (resolve) {
                    var request = new chrome.cast.media.VolumeRequest(new chrome.cast.Volume(null, true));
                    media.setVolume(request, function () {
                        resolve(media);
                    }, function (err) {
                        fail(err.code + ': ' + err.description);
                        resolve();
                    });
                });
            }

            function unmuteVolumeSuccess (media) {
                return new Promise(function (resolve) {
                    var request = new chrome.cast.media.VolumeRequest(new chrome.cast.Volume(null, false));
                    media.setVolume(request, function () {
                        resolve(media);
                    }, function (err) {
                        fail(err.code + ': ' + err.description);
                        resolve();
                    });
                });
            }

            function stopSuccess (media) {
                return new Promise(function (resolve) {
                    media.stop(null, function () {
                        resolve(media);
                    }, function (err) {
                        fail(err.code + ': ' + err.description);
                        resolve();
                    });
                });
            }

            function stopSession (session) {
                return new Promise(function (resolve) {
                    session.stop(function () {
                        resolve(session);
                    }, function (err) {
                        fail(err.code + ': ' + err.description);
                        resolve();
                    });
                });
            }

        });

        /**
         * This tests that after the session has been stopped that we do not receive
         * the old (dead) session on initialize if we ask to initialize again with
         * the same app id.
         */
        it('SPEC_01400 initialize should succeed (default receiver) but no session', function (done) {
            var step = 1;
            var sessionRequest = new chrome.cast.SessionRequest(applicationID_default);
            var apiConfig = new chrome.cast.ApiConfig(sessionRequest, function (session) {
                fail('SPEC_01400 should not receive a session');
            }, function receiverListener (available) {
                if (step === 1) {
                    fail('SPEC_01400 - Did not hit initialize Step 1 first');
                }
                if (step === 2) {
                    // Step 2 - We must get the unavailable notification
                    if (available !== 'unavailable') {
                        fail('SPEC_01400 - Step 2 - Hit receiver listener with non-unavailable status');
                    } else {
                        step++;
                    }
                }
                if (step === 3) {
                    // Step 3 - We are allowed to receive multiple unavailable until we receive the first available in this step
                    if (available !== 'unavailable' && available !== 'available') {
                        fail('SPEC_01400 - Step 3 - Hit receiver listener with incorrect status');
                    }
                    if (available === 'available') {
                        expect('success').toBeDefined();
                        done();
                    }
                }
            });
            chrome.cast.initialize(apiConfig, function () {
                // Step 1
                if (step !== 1) {
                    fail('SPEC_01400 - Step 1 - Expected to hit this first, but did not');
                }
                step++;
            }, function (err) {
                fail(err.code + ': ' + err.description);
                done();
            });
        });

    });
};
