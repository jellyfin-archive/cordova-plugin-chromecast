<h1 align="center">cordova-plugin-chromecast</h1>
<h3 align="center">Control Chromecast from your Cordova app</h3>

# Installation

```
cordova plugin add https://github.com/jellyfin/cordova-plugin-chromecast.git
```

# Usage

This project attempts to implement the [official Google Cast API for Chrome](https://developers.google.com/cast/docs/reference/chrome#chrome.cast) within the Cordova webview.  
This means that you should be able to write almost identical code in cordova as you would if you were developing for desktop Chrome.  

We have not implemented every function in the [API](https://developers.google.com/cast/docs/reference/chrome#chrome.cast) but most of the core functions are there.  If you find a function is missing we welcome [pull requests](#contributing)!  Alternatively, you can file an [issue](https://github.com/jellyfin/cordova-plugin-chromecast/issues), please include a code sample of the expected functionality if possible!

The only significant difference between the [cast API](https://developers.google.com/cast/docs/reference/chrome#chrome.cast) and this plugin is the initialization.

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

## Specific to this plugin
We have added some additional methods beyond the [Chromecast API]((https://developers.google.com/cast/docs/reference/chrome#chrome.cast)).  
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
* With **admin permission** run: `cordova plugin add --link <relative path to the plugin's root dir>`

#### About the `--link` flag
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

How to run the tests:
* With **admin permission** run `cordova plugin add --link <relative path to the plugin's root dir>/tests`
* Change `config.xml`'s content tag to `<content src="plugins/cordova-plugin-chromecast-tests/www/tests.html" />`
* You must a valid chromecast on your network to run the tests.
* Run the app, let auto tests do its thing, and then follow the directions for manual tests.

[Why we chose a non-standard test framework](https://github.com/jellyfin/cordova-plugin-chromecast/issues/50)

### Tests Chrome

The auto tests also run in desktop chrome.  
They use the google provided cast_sender.js.  
These are particularly useful for ensuring we are following the [official Google Cast API for Chrome](https://developers.google.com/cast/docs/reference/chrome#chrome.cast) correctly.  
To run the tests:
* run: `npm run host-chrome-tests [<port default=8432>]`
* Navigate to: `http://localhost:<port>/chrome/tests_chrome.html`

## Contributing

* Write a test for your contribution if applicable (for a bug fix, new feature, etc)
  * You should test on [Chrome](#tests-chrome) first to ensure you are following [Google Cast API](https://developers.google.com/cast/docs/reference/chrome#chrome.cast) behavior correctly
  * If the test does not pass on [Chrome](#tests-chrome) we should not be implementing it either (unless it is a `chrome.cast.cordova` function)
* Make sure all tests pass ([Code Format](#code-format), [Tests Mobile](#tests-mobile), and [Tests Chrome](#tests-chrome))
* Update documentation as necessary
