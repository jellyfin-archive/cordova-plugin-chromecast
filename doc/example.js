document.addEventListener('deviceready', function () {
    // Must wait for deviceready before using chromecast

    var chrome = window.chrome;

    // File globals
    var _session;
    var _media;

    initialize();

    function initialize () {
        // use default app id
        var appId = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
        var apiConfig = new chrome.cast.ApiConfig(new chrome.cast.SessionRequest(appId), function sessionListener (session) {
                // The session listener is only called under the following conditions:
                // * will be called shortly chrome.cast.initialize is run
                // * if the device is already connected to a cast session
                // Basically, this is what allows you to re-use the same cast session
                // across different pages and after app restarts
        }, function receiverListener (receiverAvailable) {
                // receiverAvailable is a boolean.
                // True = at least one chromecast device is available
                // False = No chromecast devices available
                // You can use this to determine if you want to show your chromecast icon
        });

        // initialize chromecast, this must be done before using other chromecast features
        chrome.cast.initialize(apiConfig, function () {
            // Initialize complete
            // Let's start casting
            requestSession();
        }, function (err) {
            // Initialize failure
            console.log(err);
        });
    }

    function requestSession () {
        // This will open a native dialog that will let
        // the user choose a chromecast to connect to
        // (Or will let you disconnect if you are already connected)
        chrome.cast.requestSession(function (session) {
            // Got a session!
            _session = session;

            // Load a video
            loadMedia();
        }, function (err) {
            // Failed, or if err is cancel, the dialog closed
            console.log(err);
        });
    }

    function loadMedia () {
        var videoUrl = 'https://ia801302.us.archive.org/1/items/TheWater_201510/TheWater.mp4';
        var mediaInfo = new chrome.cast.media.MediaInfo(videoUrl, 'video/mp4');

        _session.loadMedia(new chrome.cast.media.LoadRequest(mediaInfo), function (media) {
            // You should see the video playing now!
            // Got media!
            _media = media;

            // Wait a couple seconds
            setTimeout(function () {
                // Lets pause the media
                pauseMedia();
            }, 4000);

        }, function (err) {
            // Failed (check that the video works in your browser)
            console.log(err);
        });
    }

    function pauseMedia () {
        _media.pause({}, function () {
            // Success

            // Wait a couple seconds
            setTimeout(function () {
                // stop the session
                stopSession();
            }, 2000);

        }, function (err) {
            // Fail
            console.log(err);
        });
    }

    function stopSession () {
        // Also stop the session (if )
        _session.stop(function () {
            // Success
        }, function (err) {
            // Fail
            console.log(err);
        });
    }

});
