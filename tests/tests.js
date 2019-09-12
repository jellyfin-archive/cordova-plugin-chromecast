/**
 * The order of the tests is very important!
 * Unfortunately using nested describes and beforeAll does not work correctly.
 * So just be careful with the order of tests!
 */

/* eslint-env jasmine */
exports.defineAutoTests = function () {
    /* eslint-disable no-undef */

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 9000;

    var appId = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
    var videoUrl = 'https://archive.org/download/CosmosLaundromatFirstCycle/Cosmos%20Laundromat%20-%20First%20Cycle%20%281080p%29.mp4'

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

        it('SPEC_00300 chrome.cast.cordova functions, receiver volume and leaveSession', function (done) {
            setupEarlyTerminator(done);
            Promise.resolve()
            .then(apiAvailable)
            .then(initialize('SPEC_00300', function (session) {
                test().fail('should not receive a session (make sure there is no active cast session when starting the tests)');
            }))
            .then(startRouteScan)
            .then(stopRouteScan)
            .then(selectRoute)
            .then(session_setReceiverVolumeLevel_success)
            .then(session_setReceiverMuted_success)
            .then(sessionLeaveSuccess)
            .then(initialize('SPEC_00330', function (session) {
                test().fail('should not receive a session (we did sessionLeave so we shouldnt be able to auto rejoin rejoin)');
            }))
            .then(sessionLeaveError_alreadyLeft)
            .then(function () {
                done();
            });
        }, 15 * 1000);

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

        }, 60 * 1000);

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
                .then(sessionStopSuccess)
                .then(sessionStopError_noSession)
                .then(sessionLeaveError_noSession)
                .then(done);
            }));
        }, 20 * 1000);

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

        function initialize (spec, sessionListener) {
            return function (arg) {
                var specName = spec + '_' + initialize.name;
                var success = 'success';
                var unavailable = 'unavailable';
                var available = 'available';
                return new Promise(function (resolve) {
                    var called = callOrder(specName, [success, unavailable, available], {}, function () {
                        resolve(arg);
                    });
                    var gotUnavailable = false;
                    var finished = false; // Need this so we stop testing after being finished
                    var apiConfig = new chrome.cast.ApiConfig(new chrome.cast.SessionRequest(appId), sessionListener, function receiverListener (availability) {
                        if (finished) {
                            return;
                        }
                        if (!gotUnavailable) {
                            // Wait until we get the first unavailable
                            if (availability === unavailable) {
                                gotUnavailable = true;
                                called(unavailable);
                            }
                        } else {
                            // We are allowed to have multiple unavailable before available
                            if (availability === available) {
                                finished = true;
                                called(available);
                            }
                        }
                    });
                    chrome.cast.initialize(apiConfig, function () {
                        called(success);
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
                    .then(media_setVolume_level_success)
                    .then(media_setVolume_muted_success)
                    .then(media_setVolume_level_and_unmuted_success)
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

        function media_setVolume_level_success (media) {
            // Set up the call order
            var specName = media_setVolume_level_success.name;
            var success = 'success';
            var update = 'update';
            return new Promise(function (resolve) {
                var called = callOrder(specName, [success, update], { anyOrder: true }, function () {
                    resolve(media);
                });

                // Ensure we select a different volume
                var vol = media.volume.media;
                if (vol) {
                    vol = Math.abs(vol - 0.5);
                } else {
                    vol = Math.round(Math.random() * 100) / 100;
                }
                var request = new chrome.cast.media.VolumeRequest(new chrome.cast.Volume(vol));

                media.addUpdateListener(function listener (isAlive) {
                    test(isAlive).toEqual(true);
                    test(media.volume).toBeInstanceOf(chrome.cast.Volume);
                    if (media.volume.level === vol) {
                        media.removeUpdateListener(listener);
                        called(update);
                    }
                });

                media.setVolume(request, function () {
                    called(success);
                }, function (err) {
                    test().fail(err.code + ': ' + err.description);
                });
            });
        }

        function media_setVolume_muted_success (media) {
            // Set up the call order
            var specName = media_setVolume_muted_success.name;
            var success = 'success';
            var update = 'update';
            return new Promise(function (resolve) {
                var called = callOrder(specName, [success, update], { anyOrder: true }, function () {
                    resolve(media);
                });

                var muted = true;

                media.addUpdateListener(function listener (isAlive) {
                    test(isAlive).toEqual(true);
                    test(media.volume).toBeInstanceOf(chrome.cast.Volume);
                    if (media.volume.muted === muted) {
                        media.removeUpdateListener(listener);
                        called(update);
                    }
                });

                media.setVolume(new chrome.cast.media.VolumeRequest(new chrome.cast.Volume(null, muted)), function () {
                    called(success);
                }, function (err) {
                    test().fail(err.code + ': ' + err.description);
                });
            });
        }

        function media_setVolume_level_and_unmuted_success (media) {
            // Set up the call order
            var specName = media_setVolume_level_and_unmuted_success.name;
            var success = 'success';
            var update = 'update';
            return new Promise(function (resolve) {
                var called = callOrder(specName, [success, update], { anyOrder: true }, function () {
                    resolve(media);
                });

                var request = new chrome.cast.media.VolumeRequest(new chrome.cast.Volume(0.2, false));

                media.addUpdateListener(function listener (isAlive) {
                    test(isAlive).toEqual(true);
                    test(media.volume).toBeInstanceOf(chrome.cast.Volume);
                    if (media.volume.level === request.volume.level
                        && media.volume.muted === request.volume.muted) {
                        media.removeUpdateListener(listener);
                        called(update);
                    }
                });

                media.setVolume(request, function () {
                    called(success);
                }, function (err) {
                    test().fail(err.code + ': ' + err.description);
                });
            });
        }

        function session_setReceiverVolumeLevel_success (session) {
            // Set up the call order
            var specName = session_setReceiverVolumeLevel_success.name;
            var success = 'success';
            var update = 'update';
            return new Promise(function (resolve) {
                var called = callOrder(specName, [success, update], { anyOrder: true }, function () {
                    resolve(session);
                });

                // Make sure the request volume is significantly different
                var requestedVolume = Math.abs(session.receiver.volume.level - 0.5);

                session.addUpdateListener(function listener (isAlive) {
                    test(isAlive).toEqual(true);
                    test(session.receiver).toBeDefined();
                    test(session.receiver.volume).toBeDefined();
                    // The receiver volume is approximate
                    if (session.receiver.volume.level > requestedVolume - 0.1 &&
                        session.receiver.volume.level < requestedVolume + 0.1) {
                        session.removeUpdateListener(listener);
                        called(update);
                    }
                });

                session.setReceiverVolumeLevel(requestedVolume, function () {
                    called(success);
                }, function (err) {
                    test().fail(err.code + ': ' + err.description);
                });
            });
        }

        function session_setReceiverMuted_success (session) {
            // Set up the call order
            var specName = session_setReceiverMuted_success.name;
            var success = 'success';
            var update = 'update';
            return new Promise(function (resolve) {
                var called = callOrder(specName, [success, update], { anyOrder: true }, function () {
                    resolve(session);
                });

                // Do the opposite mute state as current
                var muted = !session.receiver.volume.muted;

                session.addUpdateListener(function listener (isAlive) {
                    test(isAlive).toEqual(true);
                    test(session.receiver).toBeDefined();
                    test(session.receiver.volume).toBeDefined();
                    if (session.receiver.volume.muted === muted) {
                        session.removeUpdateListener(listener);
                        called(update);
                    }
                });

                session.setReceiverMuted(muted, function () {
                    called(success);
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
            // Set up the call order
            var specName = requestSessionStopCastingUiStopSuccess.name;
            var error = 'error';
            var update = 'update';
            return new Promise(function (resolve) {
                var called = callOrder(specName, [error, update], { anyOrder: true }, function () {
                    resolve(session);
                });
                alert('---TEST INSTRUCTION---\nPlease click "Stop casting"');
                session.addUpdateListener(function listener (isAlive) {
                    if (session.status === chrome.cast.SessionStatus.STOPPED) {
                        test(isAlive).toEqual(false);
                        session.removeUpdateListener(listener);
                        called(update);
                    }
                });

                chrome.cast.requestSession(function () {
                    test().fail('We should not reach here on stop casting');
                }, function (err) {
                    test(err).toBeInstanceOf(chrome.cast.Error);
                    test(err.code).toEqual(chrome.cast.ErrorCode.CANCEL);
                    called(error);
                });
            });
        }

        function sessionLeaveSuccess (session) {
            // Set up the call order
            var specName = sessionLeaveSuccess.name;
            var success = 'success';
            var update = 'update';
            return new Promise(function (resolve) {
                // We need to hit both of the callbacks
                var called = callOrder(specName, [success, update], { anyOrder: true }, function () {
                    resolve(session);
                });
                session.addUpdateListener(function listener (isAlive) {
                    test(isAlive).toEqual(true);
                    if (session.status === chrome.cast.SessionStatus.DISCONNECTED) {
                        session.removeUpdateListener(listener);
                        called(update);
                    }
                });
                session.leave(function () {
                    called(success);
                }, function (err) {
                    test().fail(err.code + ': ' + err.description);
                });
            });
        }

        function sessionLeaveError_alreadyLeft (session) {
            return new Promise(function (resolve) {
                session.leave(function () {
                    test().fail('session.leave - Should not call success');
                }, function (err) {
                    test(err).toBeInstanceOf(chrome.cast.Error);
                    test(err.code).toEqual(chrome.cast.Error.INVALID_PARAMETER);
                    test(err.description).toEqual('No active session');
                    resolve(session);
                });
            });
        }

        function sessionLeaveError_noSession (session) {
            return new Promise(function (resolve) {
                session.leave(function () {
                    test().fail('session.leave - Should not call success');
                }, function (err) {
                    test(err).toBeInstanceOf(chrome.cast.Error);
                    test(err.code).toEqual(chrome.cast.Error.INVALID_PARAMETER);
                    test(err.description).toEqual('No active session');
                    resolve(session);
                });
            });
        }

        function sessionStopSuccess (session) {
            // Set up the call order
            var specName = sessionStopSuccess.name;
            var success = 'success';
            var update = 'update';
            return new Promise(function (resolve) {
                var called = callOrder(specName, [success, update], { anyOrder: true }, function () {
                    resolve(session);
                });
                session.addUpdateListener(function listener (isAlive) {
                    if (session.status === chrome.cast.SessionStatus.STOPPED) {
                        test(isAlive).toEqual(false);
                        session.removeUpdateListener(listener);
                        called(update);
                    }
                });
                session.stop(function () {
                    called(success);
                }, function (err) {
                    test().fail(err.code + ': ' + err.description);
                });
            });
        }

        function sessionStopError_noSession (session) {
            return new Promise(function (resolve) {
                session.stop(function () {
                    test().fail('session.stop - Should not call success');
                }, function (err) {
                    test(err).toBeInstanceOf(chrome.cast.Error);
                    test(err.code).toEqual(chrome.cast.Error.INVALID_PARAMETER);
                    test(err.description).toEqual('No active session');
                    resolve(session);
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

        /**
         * Set up the callOrder outside of a promise and it will automatically
         * add the calling function name to outputs.
         * @param {string} spec - (optional) name of test for outputting on failure
         * @param {array} order - array of strings that dictate the expected order of calls
         * @param {object} options -
         * @property {boolean} anyOrder - if the order calls can happen in any order
         * @param {function} callback - called when all the calls in order have happened
         */
        function callOrder (spec, order, options, callback) {
            options = options || {};
            var called = [];
            spec = spec ? spec + '_' : '';

            return function (callName) {
                if (options.anyOrder) {
                    var index = order.indexOf(callName);
                    if (index > -1) {
                        called.push(order.splice(index, 1)[0]);
                    } else if (called.indexOf(callName) === -1) {
                        test().fail('Did not expect this call: ' + spec + callName);
                    }
                } else {
                    var expected = order.splice(0, 1)[0];
                    if (callName !== expected) {
                        test().fail('Expected call, "' + spec + expected + '", got, "' + spec + callName + '"');
                    }
                }
                if (order.length === 0) {
                    callback();
                }
            };
        }
    });
};
