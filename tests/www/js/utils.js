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
    var assert = window.chai.assert;

    var utils = {};

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

        return function (callId) {
            var callDetails;
            for (var i = 0; i < calls.length; i++) {
                if (calls[i].id === callId) {
                    callDetails = calls[i];
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

    utils.testMediaProperties = function (media) {
        assert.instanceOf(media, chrome.cast.media.Media);
        assert.isNumber(media.currentItemId);
        assert.isNumber(media.currentTime);
        if (media.idleReason) {
            assert.oneOf(utils.getObjectValues(chrome.cast.media.IdleReason), media.idleReason);
        }
        utils.testMediaInfoProperties(media.media);
        assert.isNumber(media.mediaSessionId);
        assert.isNumber(media.playbackRate);
        assert.oneOf(media.playerState, utils.getObjectValues(chrome.cast.media.PlayerState));
        assert.oneOf(media.repeatMode, utils.getObjectValues(chrome.cast.media.RepeatMode));
        assert.isString(media.sessionId);
        assert.isArray(media.supportedMediaCommands);
        assert.instanceOf(media.volume, chrome.cast.Volume);
    };

    utils.testMediaInfoProperties = function (mediaInfo) {
        assert.isObject(mediaInfo);
        assert.isString(mediaInfo.contentId);
        assert.isString(mediaInfo.contentType);
        assert.isNumber(mediaInfo.duration);
        assert.isString(mediaInfo.streamType);
        assert.isArray(mediaInfo.tracks);
    };

    window['cordova-plugin-chromecast-tests'] = window['cordova-plugin-chromecast-tests'] || {};
    window['cordova-plugin-chromecast-tests'].utils = utils;
}());
