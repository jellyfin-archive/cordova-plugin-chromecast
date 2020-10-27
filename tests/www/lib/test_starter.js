(function () {
    'use strict';

    // This starts the tests for Android/iOS
    document.addEventListener('deviceready', function () {
        runTests();
    });

    // This starts the tests for desktop chrome
    window['__onGCastApiAvailable'] = function (isAvailable, err) {
        // If error, it is probably because we are not on desktop chrome
        if (err || !isAvailable) {
            // So try loading mobile
            return loadMobile();
        }
        // Else we are likely on chrome desktop
        if (isAvailable) {
            addScriptToPage('../chrome/cordova_stubs.js');
            runTests();
        }
    };

    // Assume we are on Desktop to start
    window['cordova-plugin-chromecast-tests'].isDesktop = true;

    // Url should match below if we are testing on mobile
    if (window.location.href.match(/plugins\/cordova-plugin-chromecast/)) {
        loadMobile();
    } else {
        // Assume we are on desktop and attempt to load the cast library
        addScriptToPage(
            'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=0',
            function onerror () {
                // If failed to load, we are probably on mobile
                loadMobile();
            });
    }

    function loadMobile () {
        // The assumption that we were on desktop chrome was wrong apparently
        window['cordova-plugin-chromecast-tests'].isDesktop = false;
        addScriptToPage('../../../../cordova.js');
    }

    function runTests () {
        var runner = window.mocha.run();
        // This makes it so that tests actually fail in the case of
        // uncaught exceptions inside promise catch blocks
        window.addEventListener('unhandledrejection', function (event) {
            runner.fail(runner.test || runner.currentRunnable, event.reason);
        });
    }

    function addScriptToPage (src, errorCallback) {
        var s = document.createElement('script');
        if (errorCallback) {
            s.onerror = errorCallback;
        }
        s.setAttribute('src', src);
        document.body.appendChild(s);
    }

}());
