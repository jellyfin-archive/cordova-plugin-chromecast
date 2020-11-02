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
    /* global chrome localStorage */
    var assert = window.chai.assert;

    var utils = {};

    utils.storeValue = function (name, value) {
        localStorage.setItem(name, value);
    };

    utils.getValue = function (name) {
        return localStorage.getItem(name);
    };

    utils.clearStoredValues = function () {
        localStorage.clear();
    };

    utils.isDesktop = function () {
        return window['cordova-plugin-chromecast-tests'].isDesktop || false;
    };

    /**
     * Displays the action information.
     */
    utils.setAction = function (text, btnText, btnCallback) {
        if (text || text === '') {
            document.getElementById('action-text').innerHTML = text;
        }
        var button = document.getElementById('action-button');
        if (btnCallback) {
            button.style.display = 'block';
            button.onclick = function () {
                button.style.display = 'none';
                btnCallback();
            };
        } else {
            button.style.display = 'none';
        }
        button.innerHTML = btnText || 'Done';
    };

    /**
     * Clears the action information.
     */
    utils.clearAction = function () {
        utils.setAction('None.');
    };

    /**
     * Should successfully start a session on a non-nearby, non-castGroup device.
     * If there is a problem with this function please ensure all the auto tests
     * are passing.
     */
    utils.startSession = function (callback) {
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
                    utils.joinRoute(foundRoute.id, callback);
                }, function (err) {
                    assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
                });
            }
        }, function (err) {
            assert.isObject(err);
            assert.equal(err.code, chrome.cast.ErrorCode.CANCEL);
            assert.equal(err.description, 'Scan stopped.');
        });
    };
    /**
     * Should successfully join a route.
     * If there is a problem with this function please ensure all the auto tests
     * are passing.
     */
    utils.joinRoute = function (routeId, callback) {
        chrome.cast.cordova.selectRoute(routeId, function (session) {
            utils.testSessionProperties(session);
            callback(session);
        }, function (err) {
            assert.fail('Unexpected Error: ' + err.code + ': ' + err.description);
        });
    };

    /**
     * Returns the current queue item's index in the items array.
     */
    utils.getCurrentItemIndex = function (media) {
        for (var i = 0; i < media.items.length; i++) {
            if (media.items[i].itemId === media.currentItemId) {
                return i;
            }
        }
        return 'Could get current item index for itemId: ' + media.currentItemId;
    };

    /**
     * Allows you to check that a set of calls happen in a specific order.
     * @param {array} calls - array of expected callDetails to be receive in order
     *                        details include { id: callId, repeats: boolean }
     *                        repeats=> if the call is allowed to be repeated
     * @param {function} callback - called when all the calls in order have happened
     * @returns {function(callID)} - call this with the callId that represents each
     * call.
     */
    utils.callOrder = function (calls, callback) {
        var timeout = setTimeout(function () {
            console.error('Did not receive all expected calls before 10s.\n'
            + 'Call state (look for "called" parameter): ');
            console.error(calls);
        }, 10000);
        // Set called to 0
        for (var i = 0; i < calls.length; i++) {
            calls[i].called = 0;
        }
        var expectedPos = 0;
        var expectedCall;
        return function (callId) {
            var callDetails;
            for (var i = 0; i < calls.length; i++) {
                if (calls[i].id === callId) {
                    callDetails = calls[i];
                    break;
                }
            }
            // Is it a valid call?
            if (!callDetails) {
                assert.fail('Did not expect call: ' + callId);
            }
            if (expectedPos === calls.length) {
                assert.fail('Already completed call');
            }
            expectedCall = calls[expectedPos];

            if (expectedCall.repeats && expectedCall.called
                && calls.length >= expectedPos + 1
                && callId === calls[expectedPos + 1].id) {
                // if we've matched the second call after a
                // previously called repeatable call, move on
                expectedPos++;
                expectedCall = calls[expectedPos];
            }

            if (callId === expectedCall.id) {
                // If we are on the expected call, set called = true
                expectedCall.called++;
                if (!expectedCall.repeats) {
                    // Move on
                    expectedPos++;
                }
            } else {
                assert.fail('Expected call, "' + expectedCall.id
                + ((expectedCall.called && expectedCall.repeats
                    && calls.length >= expectedPos + 1) ?
                    '" or "' + calls[expectedPos + 1].id : '')
                + '", got, "' + callId + '"');
            }

            if (calls.length === expectedPos || calls[calls.length - 1].called === 1) {
                clearTimeout(timeout);
                callback();
            }
        };
    };

    /**
     * Allows you to check that a flexible amount of specific calls have occurred
     * before moving forward.
     * @param {array} calls - array of expected call details to receive
     *                        details include { id: callId, repeats: boolean }
     *                        repeats=> if the call is allowed to be repeated
     * @param {function} callback - called when all the calls have occurred
     * @returns {function(callID)} - call this with the callId that represents each
     * call.
     */
    utils.waitForAllCalls = function (calls, callback) {
        var called = [];
        var timeout = setTimeout(function () {
            console.error('Did not receive all expected calls before 10s.\n'
            + '\n Expected calls: ' + JSON.stringify(calls)
            + '\n Received calls: ' + JSON.stringify(called));
        }, 10000);

        return function (callId) {
            var callDetails;
            for (var i = 0; i < calls.length; i++) {
                if (calls[i].id === callId) {
                    callDetails = calls[i];
                    break;
                }
            }
            // Is it a valid call?
            if (!callDetails) {
                assert.fail('Did not expect call: ' + callId);
            }
            // If it has been called already
            if (called.indexOf(callId) !== -1) {
                if (!callDetails.repeats) {
                    assert.fail('Did not expect repeat of call: ' + callId);
                }
            } else {
                // Else, it has not been called before, so add it to called
                called.push(callId);
                if (called.length === calls.length) {
                    clearTimeout(timeout);
                    callback();
                }
            }
        };
    };

    utils.getObjectValues = function (obj) {
        var dataArray = [];
        for (var o in obj) {
            dataArray.push(obj[o]);
        }
        return dataArray;
    };

    utils.testSessionProperties = function (session) {
        assert.instanceOf(session, chrome.cast.Session);
        assert.isString(session.appId);
        utils.testImages(session.appImages);
        assert.isString(session.displayName);
        assert.isArray(session.media);
        for (var i = 0; i < session.media.length; i++) {
            utils.testMediaProperties(session.media[i]);
        }
        if (session.receiver) {
            var rec = session.receiver;
            assert.isArray(rec.capabilities);
            assert.isString(rec.friendlyName);
            assert.isString(rec.label);
            assert.isString(rec.friendlyName);
            if (rec.volume.level) {
                assert.isNumber(rec.volume.level);
            }
            if (rec.volume.muted !== null && rec.volume.muted !== undefined) {
                assert.isBoolean(rec.volume.muted);
            }
        }
        assert.isString(session.sessionId);
        assert.oneOf(session.status, utils.getObjectValues(chrome.cast.SessionStatus));
        assert.isFunction(session.addUpdateListener);
        assert.isFunction(session.removeUpdateListener);
        assert.isFunction(session.loadMedia);
    };

    utils.testMediaProperties = function (media, isLiveStream) {
        assert.instanceOf(media, chrome.cast.media.Media);
        assert.isNumber(media.currentItemId);
        assert.isNumber(media.currentTime);
        if (media.idleReason) {
            assert.oneOf(media.idleReason, utils.getObjectValues(chrome.cast.media.IdleReason));
        }
        utils.testMediaInfoProperties(media.media, isLiveStream);
        assert.isNumber(media.mediaSessionId);
        assert.isNumber(media.playbackRate);
        assert.oneOf(media.playerState, utils.getObjectValues(chrome.cast.media.PlayerState));
        assert.oneOf(media.repeatMode, utils.getObjectValues(chrome.cast.media.RepeatMode));
        assert.isString(media.sessionId);
        assert.isArray(media.supportedMediaCommands);
        assert.instanceOf(media.volume, chrome.cast.Volume);
        assert.isFunction(media.addUpdateListener);
        assert.isFunction(media.removeUpdateListener);
    };

    utils.testMediaInfoProperties = function (mediaInfo, isLiveStream) {
        // queue items contain a subset of identical properties
        utils.testQueueItemMediaInfoProperties(mediaInfo);
        // properties that are exclusive (or mandatory) to media.media
        if (isLiveStream) {
            // Live stream has null duration
            assert.isNull(mediaInfo.duration);
        } else {
            assert.isNumber(mediaInfo.duration);
            if (mediaInfo.contentType.toLowerCase().indexOf('video') > -1
            || mediaInfo.contentType.toLowerCase().indexOf('audio') > -1) {
                assert.isAbove(mediaInfo.duration, 0);
            }
        }
        assert.isArray(mediaInfo.tracks);
    };

    utils.testMediaMetadata = function (metadata) {
        if (!metadata) {
            return;
        }
        if (metadata.metadataType) {
            assert.oneOf(metadata.metadataType, utils.getObjectValues(chrome.cast.media.MetadataType));
        }
        if (metadata.subtitle) {
            assert.isString(metadata.subtitle);
        }
        if (metadata.title) {
            assert.isString(metadata.title);
        }
        utils.testImages(metadata.images);
        if (metadata.type) {
            assert.oneOf(metadata.type, utils.getObjectValues(chrome.cast.media.MetadataType));
        }
    };

    utils.testImages = function (images) {
        if (!images) {
            return;
        }
        assert.isArray(images);
        var image;
        for (var i = 0; i < images.length; i++) {
            image = images[i];
            assert.isString(image.url);
        }
    };

    utils.testQueueItems = function (items) {
        assert.isArray(items);
        assert.isAtLeast(items.length, 2);
        assert.isAtMost(items.length, 3);
        var item;
        for (var i = 0; i < items.length; i++) {
            item = items[i];
            assert.isBoolean(item.autoplay);
            assert.isNumber(item.itemId);
            utils.testQueueItemMediaInfoProperties(item.media);
            assert.isNumber(item.orderId);
            assert.isNumber(item.preloadTime);
            assert.isNumber(item.startTime);
        }
    };

    utils.testQueueItemMediaInfoProperties = function (mediaInfo) {
        assert.isObject(mediaInfo);
        assert.isString(mediaInfo.contentId);
        assert.isString(mediaInfo.contentType);
        if (mediaInfo.duration) {
            assert.isNumber(mediaInfo.duration);
            if (mediaInfo.contentType.toLowerCase().indexOf('video') > -1
                || mediaInfo.contentType.toLowerCase().indexOf('audio') > -1) {
                assert.isAbove(mediaInfo.duration, 0);
            }
        }
        utils.testMediaMetadata(mediaInfo.metadata);
        assert.isString(mediaInfo.streamType);
        if (mediaInfo.tracks) {
            assert.isArray(mediaInfo.tracks);
        }
    };

    document.addEventListener('DOMContentLoaded', function (event) {
        // Clear test cookies on navigation away
        document.getElementById('back').onclick = utils.clearStoredValues;
        document.getElementById('rerun').onclick = utils.clearStoredValues;
    });

    window['cordova-plugin-chromecast-tests'] = window['cordova-plugin-chromecast-tests'] || {};
    window['cordova-plugin-chromecast-tests'].utils = utils;
}());
