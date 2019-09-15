/**
 * The order of the tests is very important!
 * Unfortunately using nested describes and beforeAll does not work correctly.
 * So just be careful with the order of tests!
 * Edit: TODO We should really switch to mocha.
 */

// We need a promise polyfill for Android < 4.4.3
// from https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.min.js
/*eslint-disable */
!(function (e, n) { typeof exports === 'object' && typeof module !== 'undefined' ? n() : typeof define === 'function' && define.amd ? define(n) : n(); }(0, function () { 'use strict'; function e (e) { var n = this.constructor; return this.then(function (t) { return n.resolve(e()).then(function () { return t; }); }, function (t) { return n.resolve(e()).then(function () { return n.reject(t); }); }); } function n (e) { return !(!e || typeof e.length === 'undefined'); } function t () {} function o (e) { if (!(this instanceof o)) throw new TypeError('Promises must be constructed via new'); if (typeof e !== 'function') throw new TypeError('not a function'); this._state = 0, this._handled = !1, this._value = undefined, this._deferreds = [], c(e, this); } function r (e, n) { for (;e._state === 3;)e = e._value; e._state !== 0 ? (e._handled = !0, o._immediateFn(function () { var t = e._state === 1 ? n.onFulfilled : n.onRejected; if (t !== null) { var o; try { o = t(e._value); } catch (r) { return void f(n.promise, r); }i(n.promise, o); } else (e._state === 1 ? i : f)(n.promise, e._value); })) : e._deferreds.push(n); } function i (e, n) { try { if (n === e) throw new TypeError('A promise cannot be resolved with itself.'); if (n && (typeof n === 'object' || typeof n === 'function')) { var t = n.then; if (n instanceof o) return e._state = 3, e._value = n, void u(e); if (typeof t === 'function') return void c((function (e, n) { return function () { e.apply(n, arguments); }; }(t, n)), e); }e._state = 1, e._value = n, u(e); } catch (r) { f(e, r); } } function f (e, n) { e._state = 2, e._value = n, u(e); } function u (e) { e._state === 2 && e._deferreds.length === 0 && o._immediateFn(function () { e._handled || o._unhandledRejectionFn(e._value); }); for (var n = 0, t = e._deferreds.length; t > n; n++)r(e, e._deferreds[n]); e._deferreds = null; } function c (e, n) { var t = !1; try { e(function (e) { t || (t = !0, i(n, e)); }, function (e) { t || (t = !0, f(n, e)); }); } catch (o) { if (t) return; t = !0, f(n, o); } } var a = setTimeout; o.prototype['catch'] = function (e) { return this.then(null, e); }, o.prototype.then = function (e, n) { var o = new this.constructor(t); return r(this, new function (e, n, t) { this.onFulfilled = typeof e === 'function' ? e : null, this.onRejected = typeof n === 'function' ? n : null, this.promise = t; }(e, n, o)), o; }, o.prototype['finally'] = e, o.all = function (e) { return new o(function (t, o) { function r (e, n) { try { if (n && (typeof n === 'object' || typeof n === 'function')) { var u = n.then; if (typeof u === 'function') return void u.call(n, function (n) { r(e, n); }, o); }i[e] = n, --f == 0 && t(i); } catch (c) { o(c); } } if (!n(e)) return o(new TypeError('Promise.all accepts an array')); var i = Array.prototype.slice.call(e); if (i.length === 0) return t([]); for (var f = i.length, u = 0; i.length > u; u++)r(u, i[u]); }); }, o.resolve = function (e) { return e && typeof e === 'object' && e.constructor === o ? e : new o(function (n) { n(e); }); }, o.reject = function (e) { return new o(function (n, t) { t(e); }); }, o.race = function (e) { return new o(function (t, r) { if (!n(e)) return r(new TypeError('Promise.race accepts an array')); for (var i = 0, f = e.length; f > i; i++)o.resolve(e[i]).then(t, r); }); }, o._immediateFn = typeof setImmediate === 'function' && function (e) { setImmediate(e); } || function (e) { a(e, 0); }, o._unhandledRejectionFn = function (e) { void 0 !== console && console && console.warn('Possible Unhandled Promise Rejection:', e); }; var l = (function () { if (typeof self !== 'undefined') return self; if (typeof window !== 'undefined') return window; if (typeof global !== 'undefined') return global; throw Error('unable to locate global object'); }()); 'Promise' in l ? l.Promise.prototype['finally'] || (l.Promise.prototype['finally'] = e) : l.Promise = o; }));
/*eslint-enable */

/* eslint-env jasmine */
exports.defineAutoTests = function () {
    /* eslint-disable no-undef */

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 9000;

    var appId = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
    var videoUrl = 'https://archive.org/download/CosmosLaundromatFirstCycle/Cosmos%20Laundromat%20-%20First%20Cycle%20%281080p%29.mp4';

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
            .then(selectRoute_fail_alreadyJoined)
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
        }, 25 * 1000);

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
            var specName = loadMediaVideo.name;
            var success = 'success';
            var loaded = 'loaded';
            return new Promise(function (resolve) {
                var loadedMedia;
                var called = callOrder(specName, [success, loaded], { anyOrder: true }, function () {
                    // Run all the media related tests
                    Promise.resolve({media: loadedMedia, session: session})
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
                });
                session.addMediaListener(function (media) {
                    Promise.resolve({media: media, session: session})
                    .then(mediaProperties)
                    .then(function () {
                        called(loaded);
                    });
                });
                session.loadMedia(new chrome.cast.media.LoadRequest(
                    new chrome.cast.media.MediaInfo(videoUrl, 'video/mp4')
                ), function (media) {
                    loadedMedia = media;
                    called(success);
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
                var foundRoute;
                chrome.cast.cordova.startRouteScan(function routeUpdate (routes) {
                    if (foundRoute) {
                        return;
                    }
                    for (var i = 0; i < routes.length; i++) {
                        var route = routes[i];
                        test(route).toBeInstanceOf(chrome.cast.cordova.Route);
                        test(route.id).toBeDefined();
                        test(route.name).toBeDefined();
                        test(route.isNearbyDevice).toBeDefined();
                        test(route.isCastGroup).toBeDefined();
                        // Find a non-nearby device so that the join is automatic
                        if (!route.isNearbyDevice) {
                            foundRoute = route;
                        }
                    }
                    if (foundRoute) {
                        resolve(foundRoute);
                    }
                }, function (err) {
                    test().fail(err.code + ': ' + err.description);
                });
            });
        }

        function stopRouteScan (arg) {
            return new Promise(function (resolve) {
                // Make sure we can stop the scan
                chrome.cast.cordova.stopRouteScan(function () {
                    resolve(arg);
                }, function (err) {
                    test().fail(err.code + ': ' + err.description);
                });
            });
        }

        function selectRoute (route) {
            return new Promise(function (resolve) {
                chrome.cast.cordova.selectRoute(route.id, function (session) {
                    Promise.resolve(session)
                    .then(sessionProperties)
                    .then(resolve);
                }, function (err) {
                    test().fail(err.code + ': ' + err.description);
                });
            });
        }

        function selectRoute_fail_alreadyJoined (arg) {
            return new Promise(function (resolve) {
                chrome.cast.cordova.selectRoute('', function (session) {
                    test().fail('Should not be allowed to selectRoute when already in session');
                }, function (err) {
                    test(err).toBeInstanceOf(chrome.cast.Error);
                    test(err.code).toEqual(chrome.cast.ErrorCode.CORDOVA_ALREADY_JOINED);
                    resolve(arg);
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
