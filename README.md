<h1 align="center">cordova-plugin-chromecast</h1>
<h3 align="center">Control Chromecast from your Cordova app</h3>

# Installation

```
cordova plugin add https://github.com/jellyfin/cordova-plugin-chromecast.git
```

### Additional iOS Installation Instructions
To **distribute** an iOS app with this plugin you must add usage descriptions to your project's `config.xml`.  
These strings will be used when asking the user for permission to use the microphone and bluetooth.
```xml
<!-- ios 6-13 (deprecated) -->
<platform name="ios">
  <config-file parent="NSBluetoothPeripheralUsageDescription" target="*-Info.plist">
      <string>Bluetooth is required to scan for nearby Chromecast devices with guest mode enabled.</string>
  </config-file>
  <!-- ios 13+ -->
  <config-file parent="NSBluetoothAlwaysUsageDescription" target="*-Info.plist">
      <string>Bluetooth is required to scan for nearby Chromecast devices with guest mode enabled.</string>
  </config-file>
  <config-file parent="NSMicrophoneUsageDescription" target="*-Info.plist">
      <string>The microphone is required to pair with nearby Chromecast devices with guest mode enabled.</string>
  </config-file>
</platform>
```

# Supports

**Android** 4.4+ (7.x highest confirmed) (may support lower, untested)  
**iOS** 9.0+ (13.2.1 highest confirmed)

## Quirks
* Android 4.4 (maybe 5.x and 6.x) are not able automatically rejoin/resume a chromecast session after an app restart.  

# Usage

This project attempts to implement the [official Google Cast API for Chrome](https://developers.google.com/cast/docs/reference/chrome#chrome.cast) within the Cordova webview.  
This means that you should be able to write almost identical code in cordova as you would if you were developing for desktop Chrome.  

We have not implemented every function in the [API](https://developers.google.com/cast/docs/reference/chrome#chrome.cast) but most of the core functions are there.  If you find a function is missing we welcome [pull requests](#contributing)!  Alternatively, you can file an [issue](https://github.com/jellyfin/cordova-plugin-chromecast/issues), please include a code sample of the expected functionality if possible!

The most significant usage difference between the [cast API](https://developers.google.com/cast/docs/reference/chrome#chrome.cast) and this plugin is the initialization.

In **Chrome desktop** you would do:
```js
window['__onGCastApiAvailable'] = function(isAvailable, err) {
  if (isAvailable) {
    // start using the api!
  }
};
```

But in **cordova-plugin-chromecast** you do:
```js
document.addEventListener("deviceready", function () {
  // start using the api!
});
```


### Example
Here is a simple [example](doc/example.js) that loads a video, pauses it, and ends the session.

## API
Here are the support [Chromecast API]((https://developers.google.com/cast/docs/reference/chrome#chrome.cast)) methods.  Any object types required by any of these methods are also supported. (eg. chrome.cast.ApiConfig)

[chrome.cast.initialize](https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.initialize)  
[chrome.cast.requestSession](https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.requestSession)  
[chrome.cast.setCustomReceivers](https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.setCustomReceivers)  
[chrome.cast.Session.setReceiverVolumeLevel](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#setReceiverVolumeLevel)  
[chrome.cast.Session.setReceiverMuted](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#setReceiverMuted)  
[chrome.cast.Session.stop](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#stop)  
[chrome.cast.Session.leave](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#leave)  
[chrome.cast.Session.sendMessage](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#sendMessage)  
[chrome.cast.Session.loadMedia](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#loadMedia)  
[chrome.cast.Session.queueLoad](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#queueLoad)  
[chrome.cast.Session.addUpdateListener](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#addUpdateListener)  
[chrome.cast.Session.removeUpdateListener](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#removeUpdateListener)  
[chrome.cast.Session.addMessageListener](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#addMessageListener)  
[chrome.cast.Session.removeMessageListener](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#removeMessageListener)  
[chrome.cast.Session.addMediaListener](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#addMediaListener)  
[chrome.cast.Session.removeMediaListener](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#removeMediaListener)  
[chrome.cast.media.Media.play](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#play)  
[chrome.cast.media.Media.pause](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#pause)  
[chrome.cast.media.Media.seek](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#seek)  
[chrome.cast.media.Media.stop](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#stop)  
[chrome.cast.media.Media.setVolume](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#setVolume)  
[chrome.cast.media.Media.supportsCommand](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#supportsCommand)  
[chrome.cast.media.Media.getEstimatedTime](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#getEstimatedTime)  
[chrome.cast.media.Media.editTracksInfo](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#editTracksInfo)  
[chrome.cast.media.Media.queueJumpToItem](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#queueJumpToItem)  
[chrome.cast.media.Media.addUpdateListener](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#addUpdateListener)  
[chrome.cast.media.Media.removeUpdateListener](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#removeUpdateListener)  


### Specific to this plugin
We have added some additional methods unique to this plugin.
They can all be found in the `chrome.cast.cordova` object. 

To make your own **custom route selector** use this:
```js
// This will begin an active scan for routes
chrome.cast.cordova.scanForRoutes(function (routes) {
  // Here is where you should update your route selector view with the current routes
  // This will called each time the routes change
  // routes is an array of "Route" objects (see below)
}, function (err) {
  // Will return with err.code === chrome.cast.ErrorCode.CANCEL when the scan has been ended
});

// When the user selects a route
// stop the scan to save battery power
chrome.cast.cordova.stopScan();

// and use the selected route.id to join the route
chrome.cast.cordova.selectRoute(route.id, function (session) {
  // Save the session for your use
}, function (err) {
  // Failed to connect to the route
});

```

**Route** object
```text
id             {string}  - Route id
name           {string}  - User friendly route name
isCastGroup    {boolean} - Is the route a cast group?
isNearbyDevice {boolean} - Is it a device only accessible via guest mode?
                           (aka. probably not on the same network, but is nearby and allows guests)
```


# Plugin Development

## Setup

Follow these direction to set up for plugin development:

* You will need an existing cordova project or [create a new cordova project](https://cordova.apache.org/#getstarted).
* Add the chromecast and chromecast tests plugins:
  * `cordova plugin add --link <path to plugin>`
  * `cordova plugin add --link <path to plugin>/tests`
  * This --link** option may require **admin permission**

#### **About the `--link` flag
The `--link` flag allows you to modify the native code (java/swift/obj-c) directly in the relative platform folder if desired.
  * This means you can work directly from Android Studio/Xcode!
  * Note: Be careful about adding and deleting files.  These changes will be exclusive to the platform folder and will not be transferred back to your plugin folder.
  * Note: The link only works for native files.  Other files such as js/css/html/etc must **not** be modified in the platform folder, these changes will be lost.
    * To update the js/css/html/etc files you must run:
        * `cordova plugin remove <plugin-name>`
        * With **admin permission**: `cordova plugin add --link <relative path to the plugin's root dir>`

## Testing

### Code Format

Run `npm test` to ensure your code fits the styling.  It will also find some errors.

  * If errors are found, you can try running `npm run style`, this will attempt to automatically fix the errors.

### Tests Mobile
Requirements:
* A chromecast device

How to run the tests:
* Follow [setup](#setup)
* Change `config.xml`'s content tag to `<content src="plugins/cordova-plugin-chromecast-tests/www/html/tests.html" />`

Auto tests:
* Run the app, select auto tests, let it do its thing

Manual tests:
* This tests tricky features of chromecast such as:
  * Resume casting session after page reload / app restart
  * Interaction between 2 devices connected to the same session
* You will need to be able to run the tests from 2 different devices (preferred) or between a device and chrome desktop browser
  * To use the chrome desktop browser see [Tests Chrome](#tests-chrome)

[Why we chose a non-standard test framework](https://github.com/jellyfin/cordova-plugin-chromecast/issues/50)

### Tests Chrome

The auto tests also run in desktop chrome.  
They use the google provided cast_sender.js.  
These are particularly useful for ensuring we are following the [official Google Cast API for Chrome](https://developers.google.com/cast/docs/reference/chrome#chrome.cast) correctly.  
To run the tests:
* run: `npm run host-chrome-tests [port default=8432]`
* Navigate to: `http://localhost:8432/chrome/tests_chrome.html`

## Contributing

* Write a test for your contribution if applicable (for a bug fix, new feature, etc)
  * You should test on [Chrome](#tests-chrome) first to ensure you are following [Google Cast API](https://developers.google.com/cast/docs/reference/chrome#chrome.cast) behavior correctly
  * If the test does not pass on [Chrome](#tests-chrome) we should not be implementing it either (unless it is a `chrome.cast.cordova` function)
* Make sure all tests pass ([Code Format](#code-format), [Tests Mobile](#tests-mobile), and [Tests Chrome](#tests-chrome))
* Update documentation as necessary
