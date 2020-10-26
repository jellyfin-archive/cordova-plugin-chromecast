/**
 * These stub plugin specific behaviour so we can run the auto tests on chrome
 * desktop browser.
 */
(function () {
    'use strict';
    /* eslint-env mocha */
    /* global chrome */

    var utils = window['cordova-plugin-chromecast-tests'].utils;

    window.chrome = window.chrome || {};
    chrome.cast = chrome.cast || {};
    chrome.cast.cordova = {};

/* -------------------------- Poly fill Cordova Functions ---------------------------------- */

    var _scanning = false;
    var _startRouteScanErrorCallback;

    /**
     * Will actively scan for routes and send the complete list of
     * active routes whenever a route change is detected.
     * It is super important that client calls "stopScan", otherwise the
     * battery could drain quickly.
     * https://github.com/jellyfin/cordova-plugin-chromecast/issues/22#issuecomment-530773677
     * @param {function(routes)} successCallback
     * @param {function(chrome.cast.Error)} successCallback
     */
    chrome.cast.cordova.startRouteScan = function (successCallback, errorCallback) {
        if (_scanning) {
            _startRouteScanErrorCallback(new chrome.cast.Error(chrome.cast.ErrorCode.CANCEL,
                'Started a new route scan before stopping previous one.'));
        }
        _startRouteScanErrorCallback = errorCallback;
        _scanning = true;
        var routes = [];
        routes.push(new chrome.cast.cordova.Route({
            id: 'normal',
            name: 'normal',
            isNearbyDevice: false,
            isCastGroup: false
        }));
        routes.push(new chrome.cast.cordova.Route({
            id: 'group',
            name: 'group',
            isNearbyDevice: false,
            isCastGroup: true
        }));
        successCallback(routes);
    };

    /**
     * Stops any active scanForRoutes.
     * @param {function(routes)} successCallback
     * @param {function(chrome.cast.Error)} successCallback
     */
    chrome.cast.cordova.stopRouteScan = function (successCallback, errorCallback) {
        _startRouteScanErrorCallback(new chrome.cast.Error(chrome.cast.ErrorCode.CANCEL,
            'Scan stopped.'));
        _scanning = false;
        successCallback();
    };

    /**
     * Attempts to join the requested route
     * @param {string} routeId
     * @param {function(routes)} successCallback
     * @param {function(chrome.cast.Error)} successCallback
     */
    chrome.cast.cordova.selectRoute = function (routeId, successCallback, errorCallback) {
        if (routeId === '') {
            return errorCallback(new chrome.cast.Error(chrome.cast.ErrorCode.SESSION_ERROR,
                'Leave or stop current session before attempting to join new session.'));
        }
        if (routeId === 'non-existant-route-id') {
            return errorCallback(new chrome.cast.Error(chrome.cast.ErrorCode.TIMEOUT,
                'Failed to join route (' + routeId + ') after 15s and 0 tries.'));
        }

        var timeout = setTimeout(function () {
            console.error('Make sure to click the "Done Joining" button.');
        }, 10000);

        utils.setAction('1. Click "<b>Request Session</b>".', ' Request Session', function () {
            utils.setAction('2. <b>Select a device</b> in the chromecast dialog.');
            chrome.cast.requestSession(function (session) {
                clearTimeout(timeout);
                utils.setAction('3. Click "<b>Done Joining</b>" after the session has started.', 'Done Joining', function () {
                    utils.clearAction();
                    successCallback(session);
                });
            }, errorCallback);
        });
    };

    chrome.cast.cordova.Route = function (jsonRoute) {
        this.id = jsonRoute.id;
        this.name = jsonRoute.name;
        this.isNearbyDevice = jsonRoute.isNearbyDevice;
        this.isCastGroup = jsonRoute.isCastGroup;
    };

    window.cordova = window.cordova || {};
    window.cordova.exec = function (successCallback, errorCallback, plugin, fnName, args) {
        if (_startRouteScanErrorCallback) {
            _startRouteScanErrorCallback(new chrome.cast.Error(chrome.cast.ErrorCode.CANCEL,
                'Scan stopped because setup triggered.'));
        }
        successCallback(['SETUP']);
    };

}());
