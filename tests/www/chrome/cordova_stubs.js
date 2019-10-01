/**
 * These stub plugin specific bahaviour so we can run the auto tests on chrome
 * desktop browser.
 */
(function () {
    'use strict';
    /* eslint-env mocha */
    /* global chrome */

    window.chrome = window.chrome || {};
    chrome.cast = chrome.cast || {};
    chrome.cast.cordova = {};

    var startJoiningButton = document.getElementById('start-session');
    var doneJoiningButton = document.getElementById('joined-session');
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
            console.error('Make sure to click done joining button.');
        }, 10000);

        // set up show the start join button
        startJoiningButton.addEventListener('click', function joinListener () {
            // hide the start joining button
            startJoiningButton.style = 'display:none;';
            startJoiningButton.removeEventListener('click', joinListener);

            chrome.cast.requestSession(function (session) {

                // set up and show the done joining button
                doneJoiningButton.addEventListener('click', function doneListener () {
                    // Hide the done joining button
                    doneJoiningButton.removeEventListener('click', doneListener);
                    doneJoiningButton.style = 'display:none;';

                    clearTimeout(timeout);
                    // setTimeout(function () {
                    successCallback(session);
                    // }, 1000);
                });
                doneJoiningButton.style = '';

            }, errorCallback);
        });
        startJoiningButton.style = '';
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

    // This actually starts the tests
    window['__onGCastApiAvailable'] = function (isAvailable, err) {
        // If error, it is probably because we are not on chrome, so just disregard
        if (isAvailable) {
            mocha.run();
        }
    };

}());
