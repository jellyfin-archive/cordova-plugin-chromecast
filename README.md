<h1 align="center">cordova-plugin-chromecast</h1>
<h3 align="center">Control Chromecast from your Cordova app</h3>

# Installation

```
cordova plugin add https://github.com/jellyfin/cordova-plugin-chromecast.git
```

# Usage

This project attempts to implement the [official Google Cast API for Chrome](https://developers.google.com/cast/docs/reference/chrome/) within the Cordova webview.  
This means that you should be able to write almost identical code in cordova as you would if you were developing for desktop Chrome.  

We have not implemented every function in the [API](https://developers.google.com/cast/docs/reference/chrome/) but most of the core functions are there.  If you find a function is missing we welcome [pull requests](#contributing)!  Alternatively, you can file an [issue](https://github.com/jellyfin/cordova-plugin-chromecast/issues), please include a code sample of the expected functionality if possible!

The only significant difference between the [cast API](https://developers.google.com/cast/docs/reference/chrome/) and this plugin is the initialization.

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
We have added some additional methods beyond the [Chromecast API]((https://developers.google.com/cast/docs/reference/chrome/)).  
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


## Formatting

* Run `npm run style` (from the plugin directory)
  * If you get `Error: Cannot find module '<project root>\node_modules\eslint\bin\eslint'`
    * Run `npm install`
  * If it finds any formatting errors you can try and automatically fix them with:
    * `node node_modules/eslint/bin/eslint <file-path> --fix`
  * Otherwise, please manually fix the error before committing

## Testing

**1)** 

Run `npm test` to ensure your code fits the styling.  It will also pick some errors.

**2)**

This plugin has [cordova-plugin-test-framework](https://github.com/apache/cordova-plugin-test-framework) tests.

To run these tests you can follow [these instructions](https://github.com/miloproductionsinc/cordova-testing).

NOTE: You must run these tests from a project with the package name `com.miloproductionsinc.plugin_tests` otherwise `SPEC_00310` will fail.  (It uses a custom receiver which are only allowed receive from one package name.)
  
  * You can temporarily rename the project you are testing from:
    * config.xml > `<widget id="com.miloproductionsinc.plugin_tests"`
  * Or clone this project https://github.com/miloproductionsinc/cordova-testing


## Contributing

* Make sure all tests pass
* Preferably, write a test for your contribution if applicable (for a bug fix, new feature, etc)
