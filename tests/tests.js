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

    var appId = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
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

        it('SPEC_00300 chrome.cast.cordova functions', function (done) {
            setupEarlyTerminator(done);
            Promise.resolve()
            .then(apiAvailable)
            .then(initialize('SPEC_00300', function (session) {
                throw new Error('should not receive a session (make sure there is no active cast session when starting the tests)');
            }))
            .then(startRouteScan)
            .then(stopRouteScan)
            .then(selectRoute)
            .then(sessionStop)
            .then(done);
        }, USER_INTERACTION_TIMEOUT);

        /**
         * Pre-requisite: You must have a valid receiver (chromecast) plugged in and available.
         */
        it('SPEC_00400 Normal usage cycle', function (done) {
            setupEarlyTerminator(done);
            Promise.resolve()
            .then(apiAvailable)
            .then(initialize('SPEC_00400', function (session) {
                test().fail('should not receive a session (make sure there is no active cast session when starting the tests)');
            }))
            .then(requestSessionCancel)
            .then(requestSessionSuccess)
            .then(loadMediaVideo)
            .then(requestSessionStopCastingUiCancel)
            .then(requestSessionStopCastingUiStopSuccess)
            .then(done);

        }, USER_INTERACTION_TIMEOUT);

        /**
         * When on a new page, initialize should be called again
         * This should result in the session being passed to the
         * session listener as long as teh requested appId does
         * not change.
         */
        it('SPEC_00500 stopSession and new page simulation', function (done) {
            setupEarlyTerminator(done);
            Promise.resolve()
            .then(apiAvailable)
            .then(initialize('SPEC_00503', function (session) {
                throw new Error('should not receive a session (make sure there is no active cast session when starting the tests)');
            }))
            .then(requestSessionSuccess)
            .then(initialize('SPEC_00506', function (session) {
                Promise.resolve(session)
                .then(sessionProperties)
                .then(sessionStop)
                .then(done);
            }));
        }, USER_INTERACTION_TIMEOUT);

        function setupEarlyTerminator (done) {
            // Add this so that thrown errors are not obscured.
            // This is required for early test termination
            window.addEventListener('cordovacallbackerror', function (e) {
                window.removeEventListener('cordovacallbackerror', this);
                fail(e.stack);
                done();
            });
            expect('just to make jasmine happy that there is an expect in the tests').toBeDefined();
        }

        function apiAvailable () {
            return new Promise(function (resolve) {
                var interval = setInterval(function () {
                    if (chrome.cast.isAvailable) {
                        test(chrome.cast.isAvailable).toEqual(true);
                        clearInterval(interval);
                        resolve();
                    }
                }, 500);
            });
        }

        function initialize (specName, sessionListener) {
            return function () {
                return new Promise(function (resolve) {
                    var step = 1;
                    var sessionRequest = new chrome.cast.SessionRequest(appId);
                    var apiConfig = new chrome.cast.ApiConfig(sessionRequest, sessionListener, function receiverListener (available) {
                        if (step === 1) {
                            test().fail(specName + ' - Initialize did not hit Step 1 first');
                        }
                        if (step === 2) {
                            // Step 2 - We must get the unavailable notification
                            if (available !== 'unavailable') {
                                test().fail(specName + ' - Initialize - Step 2 - Hit receiver listener with non-unavailable status');
                            } else {
                                step++;
                            }
                        }
                        if (step === 3) {
                            // Step 3 - We are allowed to receive multiple unavailable until we receive the first available in this step
                            if (available !== 'unavailable' && available !== 'available') {
                                test().fail(specName + ' - Initialize - Step 3 - Hit receiver listener with incorrect status');
                            }
                            if (available === 'available') {
                                resolve();
                            }
                        }
                    });
                    chrome.cast.initialize(apiConfig, function () {
                        // Step 1
                        if (step !== 1) {
                            test().fail(specName + ' - Initialize - Step 1 - Expected to hit this first, but did not');
                        }
                        step++;
                    }, function (err) {
                        test().fail(err.code + ': ' + err.description);
                    });
                });
            };
        }

        function requestSessionCancel () {
            return new Promise(function (resolve) {
                alert('---TEST INSTRUCTION---\nPlease click outside of the next dialog to dismiss it.');
                chrome.cast.requestSession(function (session) {
                    test().fail('We should not reach here on dismiss (make sure you cancelled the dialog for this test!)');
                }, function (err) {
                    test(err).toBeInstanceOf(chrome.cast.Error);
                    test(err.code).toEqual(chrome.cast.ErrorCode.CANCEL);
                    resolve();
                });
            });
        }

        function requestSessionSuccess () {
            return new Promise(function (resolve) {
                alert('---TEST INSTRUCTION---\nPlease select a valid chromecast in the next dialog.');
                chrome.cast.requestSession(function (session) {
                    Promise.resolve(session)
                    .then(sessionProperties)
                    .then(resolve);
                }, function (err) {
                    test().fail(err.code + ': ' + err.description);
                });
            });
        }

        function sessionProperties (session) {
            return new Promise(function (resolve) {
                test(session).toBeInstanceOf(chrome.cast.Session);
                test(session.appId).toBeDefined();
                test(session.displayName).toBeDefined();
                test(session.receiver).toBeDefined();
                test(session.receiver.friendlyName).toBeDefined();
                test(session.addUpdateListener).toBeDefined();
                test(session.removeUpdateListener).toBeDefined();
                test(session.loadMedia).toBeDefined();

                resolve(session);
            });
        }

        function loadMediaVideo (session) {
            return new Promise(function (resolve) {
                var mediaInfo = new chrome.cast.media.MediaInfo(videoUrl, 'video/mp4');
                test(mediaInfo).toBeDefined();

                var request = new chrome.cast.media.LoadRequest(mediaInfo);
                test(request).toBeDefined();

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
                    test().fail(err.code + ': ' + err.description);
                });
            });
        }

        function mediaProperties (data) {
            return new Promise(function (resolve) {
                var media = data.media;
                var session = data.session;
                test(media).toBeInstanceOf(chrome.cast.media.Media);
                test(media.sessionId).toEqual(session.sessionId);
                test(media.addUpdateListener).toBeDefined();
                test(media.removeUpdateListener).toBeDefined();
                resolve(media);
            });
        }

        function pauseSuccess (media) {
            return new Promise(function (resolve) {
                setTimeout(function () {
                    media.pause(null, function () {
                        resolve(media);
                    }, function (err) {
                        test().fail(err.code + ': ' + err.description);
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
                        test().fail(err.code + ': ' + err.description);
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
                        test().fail(err.code + ': ' + err.description);
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
                    test().fail(err.code + ': ' + err.description);
                });
            });
        }

        function muteVolumeSuccess (media) {
            return new Promise(function (resolve) {
                var request = new chrome.cast.media.VolumeRequest(new chrome.cast.Volume(null, true));
                media.setVolume(request, function () {
                    resolve(media);
                }, function (err) {
                    test().fail(err.code + ': ' + err.description);
                });
            });
        }

        function unmuteVolumeSuccess (media) {
            return new Promise(function (resolve) {
                var request = new chrome.cast.media.VolumeRequest(new chrome.cast.Volume(null, false));
                media.setVolume(request, function () {
                    resolve(media);
                }, function (err) {
                    test().fail(err.code + ': ' + err.description);
                });
            });
        }

        function stopSuccess (media) {
            return new Promise(function (resolve) {
                media.stop(null, function () {
                    resolve(media);
                }, function (err) {
                    test().fail(err.code + ': ' + err.description);
                });
            });
        }

        function requestSessionStopCastingUiCancel (session) {
            return new Promise(function (resolve) {
                alert('---TEST INSTRUCTION---\nPlease click outside of the next dialog to dismiss it.');
                chrome.cast.requestSession(function () {
                    test().fail('We should not reach here on dismiss');
                }, function (err) {
                    test(err).toBeInstanceOf(chrome.cast.Error);
                    test(err.code).toEqual(chrome.cast.ErrorCode.CANCEL);
                    resolve(session);
                });
            });
        }

        function requestSessionStopCastingUiStopSuccess (session) {
            return new Promise(function (resolve) {
                alert('---TEST INSTRUCTION---\nPlease click "Stop casting"');
                chrome.cast.requestSession(function () {
                    test().fail('We should not reach here on stop casting');
                }, function (err) {
                    test(err).toBeInstanceOf(chrome.cast.Error);
                    test(err.code).toEqual(chrome.cast.ErrorCode.CANCEL);
                    resolve(session);
                });
            });
        }

        function sessionStop (session) {
            return new Promise(function (resolve) {
                session.stop(function () {
                    resolve(session);
                }, function (err) {
                    test().fail(err.code + ': ' + err.description);
                });
            });
        }

        function startRouteScan () {
            return new Promise(function (resolve) {
                var once = true;
                chrome.cast.cordova.startRouteScan(function routeUpdate (routes) {
                    if (once && routes.length > 0) {
                        once = false;

                        var route = routes[0];
                        test(route).toBeInstanceOf(chrome.cast.cordova.Route);
                        test(route.id).toBeDefined();
                        test(route.name).toBeDefined();

                        resolve(routes);
                    }
                }, function (err) {
                    fail(err.code + ': ' + err.description);
                    resolve();
                });
            });
        }

        function stopRouteScan (routes) {
            return new Promise(function (resolve) {
                // Make sure we can stop the scan
                chrome.cast.cordova.stopRouteScan(function () {
                    resolve(routes);
                }, function (err) {
                    test().fail(err.code + ': ' + err.description);
                    resolve();
                });
            });
        }

        function selectRoute (routes) {
            return new Promise(function (resolve) {
                chrome.cast.cordova.selectRoute(routes[0], function (session) {
                    Promise.resolve(session)
                    .then(sessionProperties)
                    .then(resolve);
                }, function (err) {
                    fail(err.code + ': ' + err.description);
                    resolve(routes);
                });
            });
        }

        function test (actual) {
            return {
                toEqual: function (expected) {
                    if (actual !== expected) {
                        throw new Error('Expected "' + actual + '" to be "' + expected + '"');
                    }
                },
                toBeInstanceOf: function (expected) {
                    if (!(actual instanceof expected)) {
                        throw new Error('Expected "' + actual + '" to be an instance of "' + expected.name + '"');
                    }
                },
                toBeDefined: function () {
                    if (actual === null || actual === undefined) {
                        throw new Error('Expected "' + actual + '" to be defined.');
                    }
                },
                fail: function (message) {
                    throw new Error(message);
                }
            };
        }

    });
};
