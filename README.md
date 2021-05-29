<h1 align="center">cordova-plugin-chromecast</h1>
<h3 align="center">Control Chromecast from your Cordova app</h3>

---

### NOTICE: This isn't really actively mainted, if you would like be the maintainer of **cordova-plugin-chromecast**, please fork and submit a PR to change this notice to point to your fork!

---

# Installation

```
cordova plugin add https://github.com/jellyfin/cordova-plugin-chromecast.git
```

If you have trouble installing the plugin or running the project for iOS, from `/platforms/ios/` try running:  
```bash
sudo gem install cocoapods
pod repo update
pod install
```

### Additional iOS Installation Instructions
To **distribute** an iOS app with this plugin you must add usage descriptions to your project's `config.xml`.  
The "*Description" key strings will be used when asking the user for permission to use the microphone/bluetooth/local network.  
```xml
<platform name="ios">
  <!-- ios 6-13 (deprecated) -->
  <config-file parent="NSBluetoothPeripheralUsageDescription" target="*-Info.plist" comment="cordova-plugin-chromecast">
      <string>Bluetooth is required to scan for nearby Chromecast devices with guest mode enabled.</string>
  </config-file>
  <!-- ios 13+ -->
  <config-file parent="NSBluetoothAlwaysUsageDescription" target="*-Info.plist" comment="cordova-plugin-chromecast">
      <string>Bluetooth is required to scan for nearby Chromecast devices with guest mode enabled.</string>
  </config-file>
  <config-file parent="NSMicrophoneUsageDescription" target="*-Info.plist" comment="cordova-plugin-chromecast">
      <string>The microphone is required to pair with nearby Chromecast devices with guest mode enabled.</string>
  </config-file>
  <!-- ios 14+ -->
  <config-file parent="NSLocalNetworkUsageDescription" target="*-Info.plist" comment="cordova-plugin-chromecast">
      <string>The local network permission is required to discover Cast-enabled devices on your WiFi network.</string>
  </config-file>
  <config-file parent="NSBonjourServices" target="*-Info.plist" comment="cordova-plugin-chromecast">
    <array>
      <string>_googlecast._tcp</string>
      <!-- The default receiver ID -->
      <string>_CC1AD845._googlecast._tcp</string>
      <!-- IF YOU USE A CUSTOM RECEIVER, replace the line above, and put your ID instead of "[YourCustomRecieverID]" -->
      <!-- <string>_[YourCustomRecieverID]._googlecast._tcp</string> -->
    </array>
  </config-file>
</platform>
```

## Chromecast Icon Assets  
[chromecast-assets.zip](https://github.com/jellyfin/cordova-plugin-chromecast/wiki/chromecast-assets.zip)

# Supports

**Android** 4.4+ (may support lower, untested)  
**iOS** 10.0+ (The [Google Cast iOS Sender SDK 4.5.0](https://developers.google.com/cast/docs/release-notes#september-14,-2020) says iOS 10+ but all tests on the plugin work fine for iOS 9.3.5, so it appears to work on iOs 9 anyways. :/)

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


### Example Usage
Here is a simple [example](doc/example.js) that loads a video, pauses it, and ends the session.

If you want more detailed code examples, please ctrl+f for the function of interest in [tests_auto.js](tests/www/js/tests_auto.js).  
The other test files may contain code examples of interest as well: [[tests_manual_primary_1.js](tests/www/js/tests_manual_primary_1.js), [tests_manual_primary_2.js](tests/www/js/tests_manual_primary_2.js), [tests_manual_secondary.js](tests/www/js/tests_manual_secondary.js)]

## API
Here are the supported [Chromecast API]((https://developers.google.com/cast/docs/reference/chrome#chrome.cast)) methods.  Any object types required by any of these methods are also supported. (eg. [chrome.cast.ApiConfig](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.ApiConfig)).  You can search [chrome.cast.js](www/chrome.cast.js) to check if an API is supported.

* [chrome.cast.initialize](https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.initialize)  
* [chrome.cast.requestSession](https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.requestSession)  

[chrome.cast.Session](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session)  
Most *Properties* Supported.  
Supported *Methods*:  
* [setReceiverVolumeLevel](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#setReceiverVolumeLevel)  
* [setReceiverMuted](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#setReceiverMuted)  
* [stop](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#stop)  
* [leave](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#leave)  
* [sendMessage](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#sendMessage)  
* [loadMedia](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#loadMedia)  
* [queueLoad](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#queueLoad)  
* [addUpdateListener](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#addUpdateListener)  
* [removeUpdateListener](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#removeUpdateListener)  
* [addMessageListener](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#addMessageListener)  
* [removeMessageListener](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#removeMessageListener)  
* [addMediaListener](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#addMediaListener)  
* [removeMediaListener](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Session#removeMediaListener)  

[chrome.cast.media.Media](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media)  
Most *Properties* Supported.  
Supported *Methods*:  
* [play](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#play)  
* [pause](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#pause)  
* [seek](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#seek)  
* [stop](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#stop)  
* [setVolume](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#setVolume)  
* [supportsCommand](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#supportsCommand)  
* [getEstimatedTime](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#getEstimatedTime)  
* [editTracksInfo](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#editTracksInfo)  
* [queueJumpToItem](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#queueJumpToItem)  
* [addUpdateListener](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#addUpdateListener)  
* [removeUpdateListener](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media.html#removeUpdateListener)  


### Specific to this plugin
We have added some additional methods that are unique to this plugin (that *do not* exist in the chrome cast API).
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

You can view what the plug tests should look like here:  
* [Auto Tests - Desktop Chrome](https://youtu.be/CdUwFrEht_A)
* [Auto Tests - Android or iOS](https://youtu.be/VUtiXee6m_8)
* [Manual Tests - Android or iOS](https://youtu.be/cgyOpBRXdEI)
* [Interaction Tests - Android & iOS](https://youtu.be/rphp_s5ruzM)
* [Interaction Tests - Android (or iOS) & Desktop Chrome](https://youtu.be/1ccBHqeMLhs)

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
  * [What a successful manual run looks like](https://github.com/jellyfin/cordova-plugin-chromecast/wiki/img/manual-tests-success.jpg)
  
[Why we chose a non-standard test framework](https://github.com/jellyfin/cordova-plugin-chromecast/issues/50)

### Tests Chrome

The auto tests also run in desktop chrome.  
They use the google provided cast_sender.js.  
These are particularly useful for ensuring we are following the [official Google Cast API for Chrome](https://developers.google.com/cast/docs/reference/chrome#chrome.cast) correctly.  
To run the tests:
* run: `npm run host-chrome-tests [port default=8432]`
* Navigate to: [http://localhost:8432/html/tests.html](http://localhost:8432/html/tests.html)

## Contributing

* Write a test for your contribution if applicable (for a bug fix, new feature, etc)
  * You should test on [Chrome](#tests-chrome) first to ensure you are following [Google Cast API](https://developers.google.com/cast/docs/reference/chrome#chrome.cast) behavior correctly
  * If the test does not pass on [Chrome](#tests-chrome) we should not be implementing it either (unless it is a `chrome.cast.cordova` function)
* Make sure all tests pass ([Code Format](#code-format), [Tests Mobile](#tests-mobile), and [Tests Chrome](#tests-chrome))
* Update documentation as necessary
