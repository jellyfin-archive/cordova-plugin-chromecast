/**
 * The order of these tests and this.bail(true) is very important.
 *
 * Rather than nesting deep with describes and before's we just ensure the
 * tests occur in the correct order.
 * The major advantage to this is not having to repeat test code frequently
 * making the suite slow.
 * eg. To truly isolate and test session.leave we would need a before which
 * runs startScan, get a valid route, stopScan, and selectRoute.  And these
 * would all need to be tested before using them in the before.  This is
 * where the duplication and significant slowing would come from.
 */

(function () {
    'use strict';
    /* eslint-env mocha */
    /* global chrome */

    // Set the reporter
    mocha.setup({
        bail: true,
        ui: 'bdd',
        useColors: true,
        reporter: window['cordova-plugin-chromecast-tests'].customHtmlReporter,
        slow: 8000,
        timeout: 10000
    });

    var assert = window.chai.assert;
    var utils = window['cordova-plugin-chromecast-tests'].utils;
    var mediaUtils = window['cordova-plugin-chromecast-tests'].mediaUtils;

    describe('cordova-plugin-chromecast', function () {
        // callOrder constants that are re-used frequently
        var success = 'success';
        var update = 'update';
        var stopped = 'stopped';
        var newMedia = 'newMedia';

        var session;

        it('API should be available', function (done) {
            var interval = setInterval(function () {
                if (chrome && chrome.cast && chrome.cast.isAvailable) {
                    clearInterval(interval);
                    done();
                }
            }, 100);
        });

        it('chrome.cast should contain definitions', function () {
            assert.exists(chrome.cast.VERSION);
            assert.exists(chrome.cast.ReceiverAvailability);
            assert.exists(chrome.cast.ReceiverType);
            assert.exists(chrome.cast.SenderPlatform);
            assert.exists(chrome.cast.AutoJoinPolicy);
            assert.exists(chrome.cast.Capability);
            assert.exists(chrome.cast.DefaultActionPolicy);
            assert.exists(chrome.cast.ErrorCode);
            assert.exists(chrome.cast.timeout);
            assert.exists(chrome.cast.isAvailable);
            assert.exists(chrome.cast.ApiConfig);
            assert.exists(chrome.cast.Receiver);
            assert.exists(chrome.cast.DialRequest);
            assert.exists(chrome.cast.SessionRequest);
            assert.exists(chrome.cast.Error);
            assert.exists(chrome.cast.Image);
            assert.exists(chrome.cast.SenderApplication);
            assert.exists(chrome.cast.Volume);
            assert.exists(chrome.cast.media);
            assert.exists(chrome.cast.initialize);
            assert.exists(chrome.cast.requestSession);
            assert.exists(chrome.cast.Session);
            assert.exists(chrome.cast.media.PlayerState);
            assert.exists(chrome.cast.media.ResumeState);
            assert.exists(chrome.cast.media.MediaCommand);
            assert.exists(chrome.cast.media.MetadataType);
            assert.exists(chrome.cast.media.StreamType);
            assert.exists(chrome.cast.media.timeout);
            assert.exists(chrome.cast.media.LoadRequest);
            assert.exists(chrome.cast.media.PlayRequest);
            assert.exists(chrome.cast.media.SeekRequest);
            assert.exists(chrome.cast.media.VolumeRequest);
            assert.exists(chrome.cast.media.StopRequest);
            assert.exists(chrome.cast.media.PauseRequest);
            assert.exists(chrome.cast.media.GenericMediaMetadata);
            assert.exists(chrome.cast.media.MovieMediaMetadata);
            assert.exists(chrome.cast.media.MusicTrackMediaMetadata);
            assert.exists(chrome.cast.media.PhotoMediaMetadata);
            assert.exists(chrome.cast.media.TvShowMediaMetadata);
            assert.exists(chrome.cast.media.MediaInfo);
            assert.exists(chrome.cast.media.Media);
            assert.exists(chrome.cast.Session.prototype.setReceiverVolumeLevel);
            assert.exists(chrome.cast.Session.prototype.setReceiverMuted);
            assert.exists(chrome.cast.Session.prototype.stop);
            assert.exists(chrome.cast.Session.prototype.sendMessage);
            assert.exists(chrome.cast.Session.prototype.addUpdateListener);
            assert.exists(chrome.cast.Session.prototype.removeUpdateListener);
            assert.exists(chrome.cast.Session.prototype.addMessageListener);
            assert.exists(chrome.cast.Session.prototype.removeMessageListener);
            assert.exists(chrome.cast.Session.prototype.addMediaListener);
            assert.exists(chrome.cast.Session.prototype.removeMediaListener);
            assert.exists(chrome.cast.Session.prototype.loadMedia);
            assert.exists(chrome.cast.media.Media.prototype.play);
            assert.exists(chrome.cast.media.Media.prototype.pause);
            assert.exists(chrome.cast.media.Media.prototype.seek);
            assert.exists(chrome.cast.media.Media.prototype.stop);
            assert.exists(chrome.cast.media.Media.prototype.setVolume);
            assert.exists(chrome.cast.media.Media.prototype.supportsCommand);
            assert.exists(chrome.cast.media.Media.prototype.getEstimatedTime);
            assert.exists(chrome.cast.media.Media.prototype.addUpdateListener);
            assert.exists(chrome.cast.media.Media.prototype.removeUpdateListener);
            assert.exists(chrome.cast.cordova.startRouteScan);
            assert.exists(chrome.cast.cordova.stopRouteScan);
            assert.exists(chrome.cast.cordova.selectRoute);
            assert.exists(chrome.cast.cordova.Route);
        });

        it('chrome.cast.initialize should successfully initialize', function (done) {
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
            var finished = false; // Need this so we stop testing after being finished
            var apiConfig = new chrome.cast.ApiConfig(new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID), function sessionListener (session) {
                assert.fail('should not receive a session (make sure there is no active cast session when starting the tests)');
            }, function receiverListener (availability) {
                if (!finished) {
                    called(availability);
                }
            });
            chrome.cast.initialize(apiConfig, function () {
                called(success);
            }, function (err) {
                assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
            });
        });

        it('chrome.cast.initialize should return and not get receiver available for appID == undefined', function (done) {
            var apiConfig = new chrome.cast.ApiConfig(
                new chrome.cast.SessionRequest(undefined),
                function sessionListener (session) {
                    assert.fail('should not receive a session (expecting error)');
                },
                function receiverListener (availability) {
                    assert.equal(availability, 'unavailable');
                }
            );
            chrome.cast.initialize(apiConfig, function () {
                done();
            }, function (err) {
                assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
            });
        });

        it('chrome.cast.initialize should return and not get receiver available for appID == ""', function (done) {
            var apiConfig = new chrome.cast.ApiConfig(
                new chrome.cast.SessionRequest(''),
                function sessionListener (session) {
                    assert.fail('should not receive a session (expecting error)');
                },
                function receiverListener (availability) {
                    assert.equal(availability, 'unavailable');
                }
            );
            chrome.cast.initialize(apiConfig, function () {
                done();
            }, function (err) {
                assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
            });
        });

        describe('post initialize functions', function () {
            before('API Must be available', function (done) {
                var interval = setInterval(function () {
                    if (chrome && chrome.cast && chrome.cast.isAvailable) {
                        clearInterval(interval);
                        done();
                    }
                }, 100);
            });
            before('Must be initialized', function (done) {
                var apiConfig = new chrome.cast.ApiConfig(new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID), function sessionListener (session) {
                    assert.fail('should not receive a session (make sure there is no active cast session when starting the tests)');
                }, function receiverListener () {});
                chrome.cast.initialize(apiConfig, function () {
                    done();
                }, function (err) {
                    assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                });
            });

            describe('chrome.cast.cordova functions and session.leave', function () {
                var _route;
                it('should have definitions', function () {
                    assert.exists(chrome.cast.cordova);
                    assert.exists(chrome.cast.cordova.startRouteScan);
                    assert.exists(chrome.cast.cordova.stopRouteScan);
                    assert.exists(chrome.cast.cordova.selectRoute);
                    assert.exists(chrome.cast.cordova.Route);
                });
                it('startRouteScan 2nd call should result in error for first', function (done) {
                    var called = utils.waitForAllCalls([
                        { id: success, repeats: false },
                        { id: update, repeats: true }
                    ], done);
                    var secondStarted = false;
                    chrome.cast.cordova.startRouteScan(function routeUpdate (routes) {
                        if (secondStarted) {
                            assert.fail('Should not be receiving route updates here anymore.');
                        }
                        chrome.cast.cordova.startRouteScan(function routeUpdate (routes) {
                            // We should get updates from this scan
                            called(update);
                        }, function (err) {
                            // The only acceptable way for this scan to stop
                            assert.isObject(err);
                            assert.equal(err.code, chrome.cast.ErrorCode.CANCEL);
                            assert.equal(err.description, 'Scan stopped.');
                        });
                    }, function (err) {
                        secondStarted = true;
                        assert.isObject(err);
                        assert.equal(err.code, chrome.cast.ErrorCode.CANCEL);
                        assert.equal(err.description, 'Started a new route scan before stopping previous one.');
                        called(success);
                    });
                });
                it('stopRouteScan 2nd call should succeed', function (done) {
                    chrome.cast.cordova.stopRouteScan(function () {
                        chrome.cast.cordova.stopRouteScan(function () {
                            done();
                        }, function (err) {
                            assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                        });
                    }, function (err) {
                        assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                    });
                });
                it('startRouteScan should find valid routes', function (done) {
                    _route = undefined;
                    chrome.cast.cordova.startRouteScan(function routeUpdate (routes) {
                        if (_route) {
                            return; // we have already found a valid route
                        }
                        var route;
                        for (var i = 0; i < routes.length; i++) {
                            route = routes[i];
                            assert.instanceOf(route, chrome.cast.cordova.Route);
                            assert.isString(route.id);
                            assert.isString(route.name);
                            assert.isBoolean(route.isNearbyDevice);
                            assert.isBoolean(route.isCastGroup);
                            if (!route.isNearbyDevice) {
                                _route = route;
                            }
                        }
                        if (_route) {
                            done();
                        }
                    }, function (err) {
                        assert.isObject(err);
                        assert.equal(err.code, chrome.cast.ErrorCode.CANCEL);
                    });
                });
                it('stopRouteScan should succeed and trigger cancel error in startRouteScan', function (done) {
                    var scanState = 'running';
                    var called = utils.callOrder([
                        { id: stopped, repeats: false },
                        { id: success, repeats: false }
                    ], function () {
                        done();
                    });
                    chrome.cast.cordova.startRouteScan(function routeUpdate (routes) {
                        if (scanState === 'stopped') {
                            assert.fail('Should not have gotten route update after scan was stopped');
                        }
                        if (scanState === 'running') {
                            scanState = 'stopping';
                            chrome.cast.cordova.stopRouteScan(function () {
                                scanState = 'stopped';
                                called(success);
                            }, function (err) {
                                assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                            });
                        }
                    }, function (err) {
                        assert.isObject(err);
                        assert.equal(err.code, chrome.cast.ErrorCode.CANCEL);
                        assert.equal(err.description, 'Scan stopped.');
                        called(stopped);
                    });
                });
                it('selectRoute should receive a TIMEOUT error if route does not exist', function (done) {
                    this.timeout(20000);
                    this.slow(17000);
                    var routeId = 'non-existant-route-id';
                    chrome.cast.cordova.selectRoute(routeId, function (session) {
                        assert.fail('should not have hit the success callback');
                    }, function (err) {
                        assert.isObject(err);
                        assert.equal(err.code, chrome.cast.ErrorCode.TIMEOUT);
                        assert.match(err.description, new RegExp('^Failed to join route \\(' + routeId + '\\) after [0-9]+s and [0-9]+ tries\\.$'));
                        done();
                    });
                });
                it('selectRoute should return a valid session after selecting a route', function (done) {
                    chrome.cast.cordova.selectRoute(_route.id, function (sess) {
                        session = sess;
                        utils.testSessionProperties(sess);
                        done();
                    }, function (err) {
                        assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                    });
                });
                it('selectRoute should return error if already joined', function (done) {
                    chrome.cast.cordova.selectRoute('', function (session) {
                        assert.fail('Should not be allowed to selectRoute when already in session');
                    }, function (err) {
                        assert.isObject(err);
                        assert.equal(err.code, chrome.cast.ErrorCode.SESSION_ERROR);
                        assert.equal(err.description, 'Leave or stop current session before attempting to join new session.');
                        done();
                    });
                });
                it('session.leave should leave the session', function (done) {
                    // Set up the expected calls
                    var called = utils.callOrder([
                        { id: success, repeats: false },
                        { id: update, repeats: true }
                    ], function () {
                        // TODO chrome desktop bug 2020-10-25 - recheck later
                        // Need to give desktop chrome cast some time to fully disconnect, otherwise
                        // the next test fails because it receives a session on initialize
                        setTimeout(function () {
                            done();
                        }, 1000);
                    });
                    session.addUpdateListener(function listener (isAlive) {
                        assert.isTrue(isAlive);
                        if (session.status === chrome.cast.SessionStatus.DISCONNECTED) {
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
                it('initialize should not receive a session after session.leave', function (done) {
                    var apiConfig = new chrome.cast.ApiConfig(new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID), function sessionListener (session) {
                        assert.fail('should not receive a session (we did sessionLeave so we shouldnt be able to auto rejoin rejoin)');
                    }, function receiverListener () {});
                    chrome.cast.initialize(apiConfig, function () {
                        done();
                    }, function (err) {
                        assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                    });
                });
                it('session.leave should give an error if session already left', function (done) {
                    session.leave(function () {
                        assert.fail('session.leave - Should not call success');
                    }, function (err) {
                        assert.isObject(err);
                        assert.equal(err.code, chrome.cast.ErrorCode.INVALID_PARAMETER);
                        assert.equal(err.description, 'No active session');
                        done();
                    });
                });
                after(function (done) {
                    // Make sure we have left the session
                    session.leave(function () {
                        done();
                    }, function () {
                        done();
                    });
                });
            });

            describe('chrome.cast session functions', function () {
                before(function (done) {
                    // need to have a valid session to run these tests
                    session = null;
                    var scanState = 'running';
                    var foundRoute = null;
                    chrome.cast.cordova.startRouteScan(function routeUpdate (routes) {
                        if (scanState === 'stopped') {
                            assert.fail('Should not have gotten route update after scan was stopped');
                        }
                        var route;
                        for (var i = 0; i < routes.length; i++) {
                            route = routes[i];
                            assert.instanceOf(route, chrome.cast.cordova.Route);
                            assert.isString(route.id);
                            assert.isString(route.name);
                            assert.isBoolean(route.isNearbyDevice);
                            assert.isBoolean(route.isCastGroup);
                            if (!route.isNearbyDevice && !route.isCastGroup) {
                                foundRoute = route;
                            }
                        }
                        if (foundRoute && scanState === 'running') {
                            scanState = 'stopping';
                            chrome.cast.cordova.stopRouteScan(function () {
                                scanState = 'stopped';
                                chrome.cast.cordova.selectRoute(foundRoute.id, function (sess) {
                                    utils.testSessionProperties(sess);
                                    session = sess;
                                    done();
                                }, function (err) {
                                    assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                                });
                            }, function (err) {
                                assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                            });
                        }
                    }, function (err) {
                        assert.isObject(err);
                        assert.equal(err.code, chrome.cast.ErrorCode.CANCEL);
                        assert.equal(err.description, 'Scan stopped.');
                    });
                });
                it('session.setReceiverMuted should mute the volume', function (done) {
                    var called = utils.waitForAllCalls([
                        { id: success, repeats: false },
                        { id: update, repeats: true }
                    ], function () {
                        session.removeUpdateListener(listener);
                        done();
                    });

                    // Do the opposite mute state as current
                    var muted = !session.receiver.volume.muted;

                    function listener (isAlive) {

                        assert.isTrue(isAlive);
                        assert.isObject(session.receiver);
                        assert.isObject(session.receiver.volume);
                        if (session.receiver.volume.muted === muted) {
                            called(update);
                        }
                    }
                    session.addUpdateListener(listener);
                    session.setReceiverMuted(muted, function () {
                        called(success);
                    }, function (err) {
                        assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                    });
                });
                it('session.setReceiverVolumeLevel should set the volume level', function (done) {
                    var called = utils.waitForAllCalls([
                        { id: success, repeats: false },
                        { id: update, repeats: true }
                    ], function () {
                        session.removeUpdateListener(listener);
                        done();
                    });

                    // Make sure the request volume is significantly different
                    var requestedVolume = Math.abs(session.receiver.volume.level - 0.5);

                    function listener (isAlive) {
                        assert.isTrue(isAlive);
                        assert.isObject(session.receiver);
                        assert.isObject(session.receiver.volume);
                        // Check that the receiver volume is approximate match
                        if (session.receiver.volume.level > requestedVolume - 0.1 &&
                            session.receiver.volume.level < requestedVolume + 0.1) {
                            called(update);
                        }
                    }
                    session.addUpdateListener(listener);
                    session.setReceiverVolumeLevel(requestedVolume, function () {
                        called(success);
                    }, function (err) {
                        assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                    });
                });
                it('session.stop should stop the session', function (done) {
                    // Set up the expected calls
                    var called = utils.callOrder([
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
                it('initialize should not receive a session after session.stop', function (done) {
                    var apiConfig = new chrome.cast.ApiConfig(new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID), function sessionListener (session) {
                        assert.fail('should not receive a session (we did sessionStop so we shouldnt be able to auto rejoin rejoin)');
                    }, function receiverListener () {});
                    chrome.cast.initialize(apiConfig, function () {
                        done();
                    }, function (err) {
                        assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                    });
                });
                it('session.stop should give an error if session already stopped', function (done) {
                    session.stop(function () {
                        assert.fail('session.stop - Should not call success');
                    }, function (err) {
                        assert.isObject(err);
                        assert.equal(err.code, chrome.cast.ErrorCode.INVALID_PARAMETER);
                        assert.equal(err.description, 'No active session');
                        done();
                    });
                });
                after(function (done) {
                    // Ensure the session is stopped
                    session.stop(function () {
                        done();
                    }, function () {
                        done();
                    });
                });
            });

            describe('chrome.cast media functions', function () {
                var media;
                var mediaListener = function (media) {
                    assert.fail('session.addMediaListener should only be called when an external sender loads media');
                };
                var mediaInfo;
                before('Create mediaInfo with custom metadata fields', function () {
                    mediaInfo = mediaUtils.getMediaInfoItem('VIDEO', chrome.cast.media.MetadataType.GENERIC);
                    mediaInfo.metadata.someTrueBoolean = true;
                    mediaInfo.metadata.someFalseBoolean = false;
                    mediaInfo.metadata.someSmallNumber = 15;
                    mediaInfo.metadata.someLargeNumber = 1234567890123456;
                    mediaInfo.metadata.someSmallDecimal = 15.15;
                    mediaInfo.metadata.someLargeDecimal = 1234567.123456789;
                    mediaInfo.metadata.someString = 'SomeString';
                });
                before('Get session', function (done) {
                    // need to have a valid session to run these tests
                    session = null;
                    var scanState = 'running';
                    var foundRoute = null;
                    chrome.cast.cordova.startRouteScan(function routeUpdate (routes) {
                        if (scanState === 'stopped') {
                            assert.fail('Should not have gotten route update after scan was stopped');
                        }
                        var route;
                        for (var i = 0; i < routes.length; i++) {
                            route = routes[i];
                            assert.instanceOf(route, chrome.cast.cordova.Route);
                            assert.isString(route.id);
                            assert.isString(route.name);
                            assert.isBoolean(route.isNearbyDevice);
                            assert.isBoolean(route.isCastGroup);
                            if (!route.isNearbyDevice && !route.isCastGroup) {
                                foundRoute = route;
                            }
                        }
                        if (foundRoute && scanState === 'running') {
                            scanState = 'stopping';
                            chrome.cast.cordova.stopRouteScan(function () {
                                scanState = 'stopped';
                                chrome.cast.cordova.selectRoute(foundRoute.id, function (sess) {
                                    utils.testSessionProperties(sess);
                                    session = sess;
                                    done();
                                }, function (err) {
                                    assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                                });
                            }, function (err) {
                                assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                            });
                        }
                    }, function (err) {
                        assert.isObject(err);
                        assert.equal(err.code, chrome.cast.ErrorCode.CANCEL);
                        assert.equal(err.description, 'Scan stopped.');
                    });
                });
                beforeEach(function () {
                    session.addMediaListener(mediaListener);
                });
                afterEach(function () {
                    session.removeMediaListener(mediaListener);
                });
                describe('Media (non-queues)', function () {
                    it('session.loadMedia should be able to load a remote video and handle GenericMediaMetadata', function (done) {
                        session.loadMedia(new chrome.cast.media.LoadRequest(mediaInfo), function (m) {
                            media = m;
                            utils.testMediaProperties(media);
                            assert.isUndefined(media.queueData);
                            mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                            // TODO figure out how to maintain the data types for custom params on the native side
                            // so that we don't have to do turn each actual and expected into a string
                            assert.equal(media.media.metadata.someTrueBoolean + '', mediaInfo.metadata.someTrueBoolean + '');
                            assert.equal(media.media.metadata.someFalseBoolean + '', mediaInfo.metadata.someFalseBoolean + '');
                            assert.equal(media.media.metadata.someSmallNumber + '', mediaInfo.metadata.someSmallNumber + '');
                            assert.equal(media.media.metadata.someLargeNumber + '', mediaInfo.metadata.someLargeNumber + '');
                            assert.equal(media.media.metadata.someSmallDecimal + '', mediaInfo.metadata.someSmallDecimal + '');
                            assert.equal(media.media.metadata.someLargeDecimal + '', mediaInfo.metadata.someLargeDecimal + '');
                            assert.equal(media.media.metadata.someString, mediaInfo.metadata.someString);
                            assert.notExists(media.idleReason);
                            media.addUpdateListener(function listener (isAlive) {
                                assert.isTrue(isAlive);
                                utils.testMediaProperties(media);
                                mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
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
                    it('media.setVolume should set the volume', function (done) {
                        var called = utils.waitForAllCalls([
                            { id: success, repeats: false },
                            { id: update, repeats: true }
                        ], done);

                        // Ensure we select a different volume
                        var vol = media.volume.level;
                        if (vol) {
                            vol = Math.abs(vol - 0.5);
                        } else {
                            vol = Math.random();
                        }
                        var request = new chrome.cast.media.VolumeRequest(new chrome.cast.Volume(vol));

                        media.addUpdateListener(function listener (isAlive) {
                            assert.isTrue(isAlive);
                            assert.instanceOf(media.volume, chrome.cast.Volume);
                            mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                            if (media.volume.level === vol) {
                                media.removeUpdateListener(listener);
                                called(update);
                            }
                        });

                        media.setVolume(request, function () {
                            assert.instanceOf(media.volume, chrome.cast.Volume);
                            assert.equal(media.volume.level, vol);
                            mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                            called(success);
                        }, function (err) {
                            assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                        });
                    });
                    it('media.setVolume should set muted', function (done) {
                        var called = utils.waitForAllCalls([
                            { id: success, repeats: false },
                            { id: update, repeats: true }
                        ], done);

                        var muted = true;
                        var request = new chrome.cast.media.VolumeRequest(new chrome.cast.Volume(null, muted));

                        media.addUpdateListener(function listener (isAlive) {
                            assert.isTrue(isAlive);
                            assert.instanceOf(media.volume, chrome.cast.Volume);
                            mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                            if (media.volume.muted === muted) {
                                media.removeUpdateListener(listener);
                                called(update);
                            }
                        });

                        media.setVolume(request, function () {
                            assert.instanceOf(media.volume, chrome.cast.Volume);
                            assert.equal(media.volume.muted, muted);
                            mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                            called(success);
                        }, function (err) {
                            assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                        });
                    });
                    it('media.setVolume should set the volume and mute state', function (done) {
                        var called = utils.waitForAllCalls([
                            { id: success, repeats: false },
                            { id: update, repeats: true }
                        ], done);

                        // Ensure we select a different volume
                        var vol = media.volume.level;
                        if (vol) {
                            vol = Math.abs(vol - 0.5);
                        } else {
                            vol = Math.round(Math.random() * 100) / 100;
                        }
                        var muted = false;
                        var request = new chrome.cast.media.VolumeRequest(new chrome.cast.Volume(vol, muted));

                        media.addUpdateListener(function listener (isAlive) {
                            assert.isTrue(isAlive);
                            assert.instanceOf(media.volume, chrome.cast.Volume);
                            mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                            if (media.volume.level === vol &&
                                media.volume.muted === request.volume.muted) {
                                media.removeUpdateListener(listener);
                                called(update);
                            }
                        });

                        media.setVolume(request, function () {
                            assert.instanceOf(media.volume, chrome.cast.Volume);
                            assert.equal(media.volume.level, vol);
                            assert.equal(media.volume.muted, muted);
                            mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                            called(success);
                        }, function (err) {
                            assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                        });
                    });
                    it('media.pause should pause playback', function (done) {
                        var called = utils.waitForAllCalls([
                            { id: success, repeats: false },
                            { id: update, repeats: true }
                        ], done);
                        media.addUpdateListener(function listener (isAlive) {
                            assert.isTrue(isAlive);
                            assert.notEqual(media.playerState, chrome.cast.media.PlayerState.IDLE);
                            mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                            if (media.playerState === chrome.cast.media.PlayerState.PAUSED) {
                                media.removeUpdateListener(listener);
                                called(update);
                            }
                        });
                        media.pause(null, function () {
                            assert.equal(media.playerState, chrome.cast.media.PlayerState.PAUSED);
                            mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                            called(success);
                        }, function (err) {
                            assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                        });
                    });
                    it('media.play should resume playback', function (done) {
                        var called = utils.waitForAllCalls([
                            { id: success, repeats: false },
                            { id: update, repeats: true }
                        ], done);
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
                    it('media.seek should skip to requested position', function (done) {
                        var called = utils.waitForAllCalls([
                            { id: success, repeats: false },
                            { id: update, repeats: true }
                        ], done);
                        var request = new chrome.cast.media.SeekRequest();
                        request.currentTime = media.media.duration / 2;
                        media.addUpdateListener(function listener (isAlive) {
                            assert.isTrue(isAlive);
                            mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                            if (media.getEstimatedTime() > request.currentTime - 1 &&
                                media.getEstimatedTime() < request.currentTime + 1) {
                                media.removeUpdateListener(listener);
                                called(update);
                            }
                        });
                        media.seek(request, function () {
                            assert.closeTo(media.getEstimatedTime(), request.currentTime, 1);
                            mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                            called(success);
                        }, function (err) {
                            assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                        });
                    });
                    it('media.addUpdateListener should detect end of video', function (done) {
                        var called = utils.waitForAllCalls([
                            { id: success, repeats: false },
                            { id: update, repeats: true }
                        ], done);
                        var request = new chrome.cast.media.SeekRequest();
                        request.currentTime = media.media.duration;
                        media.addUpdateListener(function listener (isAlive) {
                            mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                            if (media.playerState === chrome.cast.media.PlayerState.IDLE) {
                                media.removeUpdateListener(listener);
                                assert.equal(media.idleReason, chrome.cast.media.IdleReason.FINISHED);
                                assert.isFalse(isAlive);
                                called(update);
                            }
                        });
                        media.seek(request, function () {
                            mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                            called(success);
                        }, function (err) {
                            assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                        });
                    });
                    it('media.setVolume should return error when media is finished', function (done) {
                        var request = new chrome.cast.media.VolumeRequest(new chrome.cast.Volume());
                        media.setVolume(request, function () {
                            assert.fail('should not hit success');
                        }, function (err) {
                            assert.isObject(err);
                            assert.equal(err.code, chrome.cast.ErrorCode.SESSION_ERROR);
                            assert.equal(err.description, 'INVALID_MEDIA_SESSION_ID');
                            assert.deepEqual(err.details, { reason: 'INVALID_MEDIA_SESSION_ID', type: 'INVALID_REQUEST' });
                            done();
                        });
                    });
                    it('media.pause should return error when media is finished', function (done) {
                        media.pause(null, function () {
                            assert.fail('should not hit success');
                        }, function (err) {
                            assert.isObject(err);
                            assert.equal(err.code, chrome.cast.ErrorCode.SESSION_ERROR);
                            assert.equal(err.description, 'INVALID_MEDIA_SESSION_ID');
                            assert.deepEqual(err.details, { reason: 'INVALID_MEDIA_SESSION_ID', type: 'INVALID_REQUEST' });
                            done();
                        });
                    });
                    it('media.play should return error when media is finished', function (done) {
                        media.play(null, function () {
                            assert.fail('should not hit success');
                        }, function (err) {
                            assert.isObject(err);
                            assert.equal(err.code, chrome.cast.ErrorCode.SESSION_ERROR);
                            assert.equal(err.description, 'INVALID_MEDIA_SESSION_ID');
                            assert.deepEqual(err.details, { reason: 'INVALID_MEDIA_SESSION_ID', type: 'INVALID_REQUEST' });
                            done();
                        });
                    });
                    it('media.seek should return error when media is finished', function (done) {
                        var request = new chrome.cast.media.SeekRequest();
                        request.currentTime = media.media.duration;
                        media.seek(request, function () {
                            assert.fail('should not hit success');
                        }, function (err) {
                            assert.isObject(err);
                            assert.equal(err.code, chrome.cast.ErrorCode.SESSION_ERROR);
                            assert.equal(err.description, 'INVALID_MEDIA_SESSION_ID');
                            assert.deepEqual(err.details, { reason: 'INVALID_MEDIA_SESSION_ID', type: 'INVALID_REQUEST' });
                            done();
                        });
                    });
                    it('media.stop should return error when media is finished', function (done) {
                        media.stop(null, function () {
                            assert.fail('should not hit success');
                        }, function (err) {
                            assert.isObject(err);
                            assert.equal(err.code, chrome.cast.ErrorCode.SESSION_ERROR);
                            assert.equal(err.description, 'INVALID_MEDIA_SESSION_ID');
                            assert.deepEqual(err.details, { reason: 'INVALID_MEDIA_SESSION_ID', type: 'INVALID_REQUEST' });
                            done();
                        });
                    });
                    it('session.loadMedia should be able to load media twice in a row and handle MovieMediaMetadata and AudiobookChapterMediaMetadata correctly, and first media should be invalidated', function (done) {
                        var firstMedia;
                        var mediaInfo = mediaUtils.getMediaInfoItem('VIDEO', chrome.cast.media.MetadataType.MOVIE);

                        session.loadMedia(new chrome.cast.media.LoadRequest(mediaInfo), function (m) {
                            media = m;
                            firstMedia = m;
                            utils.testMediaProperties(media);
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
                                    loadSecond();
                                }
                            });
                        }, function (err) {
                            assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                        });

                        function loadSecond () {
                            var mediaInfo = mediaUtils.getMediaInfoItem('AUDIO', chrome.cast.media.MetadataType.AUDIOBOOK_CHAPTER);
                            session.loadMedia(new chrome.cast.media.LoadRequest(mediaInfo), function (m) {
                                media = m;
                                // Test old media is invalid (should not equal new media and should give error on pause)
                                assert.notEqual(firstMedia, m);
                                firstMedia.pause(null, function () {
                                    assert.fail('should not hit success');
                                }, function (err) {
                                    assert.isObject(err);
                                    assert.equal(err.code, chrome.cast.ErrorCode.SESSION_ERROR);
                                    assert.equal(err.description, 'INVALID_MEDIA_SESSION_ID');
                                    assert.deepEqual(err.details, { reason: 'INVALID_MEDIA_SESSION_ID', type: 'INVALID_REQUEST' });

                                    // Now verify the new media
                                    utils.testMediaProperties(media);
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
                                            done();
                                        }
                                    });
                                });
                            }, function (err) {
                                assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                            });
                        }
                    });
                    it('session.loadMedia should be able to load remote video with no metadata', function (done) {
                        var mediaInfo = mediaUtils.getMediaInfoItem('VIDEO');
                        session.loadMedia(new chrome.cast.media.LoadRequest(mediaInfo), function (m) {
                            media = m;
                            utils.testMediaProperties(media);
                            assert.oneOf(media.media.metadata, [null, undefined]);
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
                                    done();
                                }
                            });
                        }, function (err) {
                            assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                        });
                    });
                    it('session.loadMedia should be able to load live stream audio media', function (done) {
                        this.timeout(90000);
                        var mediaInfo = mediaUtils.getMediaInfoItem('LIVE_AUDIO');
                        session.loadMedia(new chrome.cast.media.LoadRequest(mediaInfo), function (m) {
                            media = m;
                            utils.testMediaProperties(media, true);
                            mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                            media.addUpdateListener(function listener (isAlive) {
                                assert.isTrue(isAlive);
                                utils.testMediaProperties(media, true);
                                mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                                assert.oneOf(media.playerState, [
                                    chrome.cast.media.PlayerState.PLAYING,
                                    chrome.cast.media.PlayerState.BUFFERING]);
                                if (media.playerState === chrome.cast.media.PlayerState.PLAYING) {
                                    console.log(media);
                                    media.removeUpdateListener(listener);
                                    done();
                                }
                            });
                        }, function (err) {
                            assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                        });
                    });
                    it('session.loadMedia should be able to load remote image and return the PhotoMediaMetadata', function (done) {
                        var mediaInfo = mediaUtils.getMediaInfoItem('IMAGE', chrome.cast.media.MetadataType.PHOTO);
                        session.loadMedia(new chrome.cast.media.LoadRequest(mediaInfo), function (m) {
                            media = m;
                            utils.testMediaProperties(media);
                            mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                            media.addUpdateListener(function listener (isAlive) {
                                assert.isTrue(isAlive);
                                utils.testMediaProperties(media);
                                mediaUtils.assertMediaInfoItemEquals(media.media, mediaInfo);
                                if (media.playerState === chrome.cast.media.PlayerState.PAUSED) {
                                    media.removeUpdateListener(listener);
                                    done();
                                }
                            });
                        }, function (err) {
                            assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                        });
                    });
                    it('media.stop should end media playback', function (done) {
                        var called = utils.waitForAllCalls([
                            { id: success, repeats: false },
                            { id: update, repeats: true }
                        ], done);
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
                describe('Queues', function () {
                    var videoItem;
                    var audioItem;
                    var startTime = 40;
                    var jumpItemId;
                    var request;

                    var assertQueueProperties = function (media) {
                        utils.testMediaProperties(media);
                        assert.equal(media.repeatMode, request.repeatMode);
                        assert.isObject(media.queueData);
                        assert.isFalse(media.queueData.shuffle);
                        assert.equal(media.queueData.startIndex, request.startIndex);
                        utils.testQueueItems(media.items);
                    };
                    before(function () {
                        videoItem = mediaUtils.getMediaInfoItem('VIDEO', chrome.cast.media.MetadataType.TV_SHOW);
                        audioItem = mediaUtils.getMediaInfoItem('AUDIO', chrome.cast.media.MetadataType.MUSIC_TRACK);
                        var item;
                        var queue = [];

                        // Add items to the queue
                        item = new chrome.cast.media.QueueItem(videoItem);
                        item.startTime = startTime;
                        queue.push(item);
                        queue.push(item);
                        item = new chrome.cast.media.QueueItem(audioItem);
                        item.startTime = startTime * 2;
                        queue.push(item);
                        queue.push(item);

                        // Create request to repeat all and start at last item
                        request = new chrome.cast.media.QueueLoadRequest(queue);
                        request.repeatMode = chrome.cast.media.RepeatMode.ALL;
                        request.startIndex = queue.length - 1;
                    });
                    it('session.queueLoad should return an error when we attempt to load an empty queue', function (done) {
                        session.queueLoad(new chrome.cast.media.QueueLoadRequest([]), function (m) {
                            assert.fail('Should not be able to load an empty queue.');
                        }, function (err) {
                            assert.isObject(err);
                            assert.equal(err.code, chrome.cast.ErrorCode.SESSION_ERROR);
                            assert.equal(err.description, 'INVALID_PARAMS');
                            assert.deepEqual(err.details, { reason: 'INVALID_PARAMS', type: 'INVALID_REQUEST' });
                            done();
                        });
                    });
                    it('session.queueLoad should be able to load remote audio/video queue and return the correct Metadata', function (done) {
                        session.queueLoad(request, function (m) {
                            media = m;
                            assertQueueProperties(media);
                            mediaUtils.assertMediaInfoItemEquals(media.media, audioItem);
                            assert.closeTo(media.getEstimatedTime(), startTime * 2, 5);

                            // Items should contain the last 2 items in the queue
                            assert.equal(media.items.length, 2);

                            var i = utils.getCurrentItemIndex(media);

                            mediaUtils.assertMediaInfoItemEquals(media.items[i - 1].media, audioItem);
                            assert.equal(media.items[i - 1].orderId, request.startIndex - 1);
                            assert.isTrue(media.items[i - 1].autoplay);
                            assert.equal(media.items[i - 1].startTime, startTime * 2);

                            mediaUtils.assertMediaInfoItemEquals(media.items[i].media, audioItem);
                            assert.equal(media.items[i].orderId, request.startIndex);
                            assert.isTrue(media.items[i].autoplay);
                            assert.equal(media.items[i].startTime, startTime * 2);

                            // Save for a later test
                            jumpItemId = media.items[i - 1].itemId;

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
                    it('Queue should start the next item automatically when previous one finishes (tests loop around of repeat_all as well)', function (done) {
                        var called = utils.callOrder([
                            { id: success, repeats: false },
                            { id: stopped, repeats: true },
                            { id: newMedia, repeats: true }
                        ], done);
                        // Create request
                        var request = new chrome.cast.media.SeekRequest();
                        request.currentTime = media.media.duration - 1;

                        // Listen for current media end
                        var prevId = media.currentItemId;
                        media.addUpdateListener(function listener (isAlive) {
                            if (media.playerState === chrome.cast.media.PlayerState.IDLE) {
                                assert.equal(media.idleReason, chrome.cast.media.IdleReason.FINISHED);
                                assert.isTrue(isAlive);
                                called(stopped);
                            }
                            if (media.currentItemId !== prevId
                                && media.playerState === chrome.cast.media.PlayerState.PLAYING) {
                                media.removeUpdateListener(listener);

                                assertQueueProperties(media);
                                mediaUtils.assertMediaInfoItemEquals(media.media, videoItem);
                                assert.closeTo(media.getEstimatedTime(), startTime, 5);

                                // Items should contain the first 2 items in the queue
                                assert.equal(media.items.length, 2);
                                var i = utils.getCurrentItemIndex(media);

                                mediaUtils.assertMediaInfoItemEquals(media.items[i].media, videoItem);
                                assert.equal(media.items[i].orderId, 0);
                                assert.isTrue(media.items[i].autoplay);
                                assert.equal(media.items[i].startTime, startTime);

                                mediaUtils.assertMediaInfoItemEquals(media.items[i + 1].media, videoItem);
                                assert.equal(media.items[i + 1].orderId, 1);
                                assert.isTrue(media.items[i + 1].autoplay);
                                assert.equal(media.items[i + 1].startTime, startTime);

                                called(newMedia);
                            }
                        });
                        // Seek to just before the end
                        media.seek(request, function () {
                            called(success);
                        }, function (err) {
                            assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                        });
                    });
                    it('media.queueJumpToItem should not call a callback for null contentId', function () {
                        media.queueJumpToItem(null, function () {
                            assert.fail('Should not be called when passing null content id to queueJumpToItem');
                        }, function () {
                            assert.fail('Should not be called when passing null content id to queueJumpToItem');
                        });
                    });
                    it('media.queueJumpToItem should not call a callback for unknown contentId', function () {
                        media.queueJumpToItem('unknown_content_id', function () {
                            assert.fail('Should not be called when passing unknown content id to queueJumpToItem');
                        }, function () {
                            assert.fail('Should not be called when passing unknown content id to queueJumpToItem');
                        });
                    });
                    it('media.queueJumpToItem should not call a callback for decimal contentId', function () {
                        media.queueJumpToItem(1.5, function () {
                            assert.fail('Should not be called when passing decimal content id to queueJumpToItem');
                        }, function () {
                            assert.fail('Should not be called when passing decimal content id to queueJumpToItem');
                        });
                    });
                    it('media.queueJumpToItem should not call a callback for contentId not currently in items', function () {
                        media.queueJumpToItem(jumpItemId, function () {
                            assert.fail('Should not be called when passing decimal content id to queueJumpToItem');
                        }, function () {
                            assert.fail('Should not be called when passing decimal content id to queueJumpToItem');
                        });
                    });
                    it('media.queueJumpToItem should jump to selected item', function (done) {
                        var calledAnyOrder = utils.waitForAllCalls([
                            { id: success, repeats: false },
                            { id: update, repeats: true }
                        ], done);
                        var calledOrder = utils.callOrder([
                            { id: stopped, repeats: true },
                            { id: newMedia, repeats: true }
                        ], function () {
                            calledAnyOrder(update);
                        });
                        var prevItemId = media.currentItemId;
                        media.addUpdateListener(function listener (isAlive) {
                            if (media.playerState === chrome.cast.media.PlayerState.IDLE) {
                                assert.equal(media.idleReason, chrome.cast.media.IdleReason.INTERRUPTED);
                                assert.isTrue(isAlive);
                                calledOrder(stopped);
                            }
                            if (media.currentItemId !== prevItemId
                                && media.playerState === chrome.cast.media.PlayerState.PLAYING) {
                                media.removeUpdateListener(listener);

                                assertQueueProperties(media);
                                mediaUtils.assertMediaInfoItemEquals(media.media, videoItem);
                                assert.closeTo(media.getEstimatedTime(), startTime, 5);

                                // Items should contain the first 3 items in the queue (1 before and 1 after current item)
                                assert.equal(media.items.length, 3);
                                var i = utils.getCurrentItemIndex(media);

                                mediaUtils.assertMediaInfoItemEquals(media.items[i - 1].media, videoItem);
                                assert.equal(media.items[i - 1].orderId, 0);
                                assert.isTrue(media.items[i - 1].autoplay);
                                assert.equal(media.items[i - 1].startTime, startTime);

                                mediaUtils.assertMediaInfoItemEquals(media.items[i].media, videoItem);
                                assert.equal(media.items[i].orderId, 1);
                                assert.isTrue(media.items[i].autoplay);
                                assert.equal(media.items[i].startTime, startTime);

                                mediaUtils.assertMediaInfoItemEquals(media.items[i + 1].media, audioItem);
                                assert.equal(media.items[i + 1].orderId, 2);
                                assert.isTrue(media.items[i + 1].autoplay);
                                assert.equal(media.items[i + 1].startTime, startTime * 2);
                                calledOrder(newMedia);
                            }
                        });
                        // Jump to next item
                        media.queueJumpToItem(media.items[media.items.length - 1].itemId, function () {
                            calledAnyOrder(success);
                        }, function (err) {
                            assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                        });
                    });
                });
                after(function (done) {
                    // Set up the expected calls
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
            });

            describe('Tests that break the suite that must come last', function () {
                // This test will prevent all future events (eg. SESSION_UPDATE)
                // from being received.  So run last.
                it('setup should stop any existing scan', function (done) {
                    var setupTriggered = false;
                    var called = utils.callOrder([
                        { id: stopped, repeats: false },
                        { id: success, repeats: false }
                    ], done);
                    // Listen for cancel error
                    chrome.cast.cordova.startRouteScan(function routeUpdate (routes) {
                        // Wait for the scan to be loaded before adding the iframe
                        if (!setupTriggered) {
                            // Manually trigger setup
                            setupTriggered = true;
                            window.cordova.exec(function (result) {
                                if (result[0] === 'SETUP') {
                                    called(success);
                                }
                            }, function (err) {
                                assert.fail(err);
                            }, 'Chromecast', 'setup', []);
                        }
                    }, function (err) {
                        assert.isObject(err);
                        assert.equal(err.code, chrome.cast.ErrorCode.CANCEL);
                        assert.equal(err.description, 'Scan stopped because setup triggered.');
                        called(stopped);
                    });
                });
            });

        });

    });

}());
