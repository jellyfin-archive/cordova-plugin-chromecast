<h1 align="center">cordova-plugin-chromecast</h1>
<h3 align="center">Chromecast in Cordova</h3>

## Installation
Add the plugin with the command below in your cordova project directory.

```
cordova plugin add https://github.com/jellyfin/cordova-plugin-chromecast.git
```

## Usage

This project attempts to implement the official Google Cast SDK for Chrome within Cordova. We've made a lot of progress in making this possible, so check out the [offical documentation](https://developers.google.com/cast/docs/chrome_sender) for examples.

When you call `chrome.cast.requestSession()` a popup will be displayed to select a Chromecast. If you would prefer to make your own interface you can call `chrome.cast.getRouteListElement()` which will return a `<ul>` tag that contains the Chromecasts in a list. All you have to do is style that bad boy and you're off to the races!

## Status

The project is now pretty much feature complete - the only things that will possibly break are missing parameters. We haven't done any checking for optional paramaters. When using the plugin make sure your constructors and function calls have every parameter you can find in the method declarations.

<h3 align="center">Plugin Development<h3>

* Link your local copy of the the plugin to a project for development and testing
  * With admin permission run `cordova plugin add --link <relative path to the plugin's root dir>`
* This links the plugin's **java** files directly to the Android platform.  So you can modify the files from Android studio and re-deploy from there.
* Unfortunately it does **not** link the js files.
* To update the js files you must run
    * `cordova plugin remove <plugin-name>`
    * `cordova plugin add --link <relative path to the plugin's root dir>`
        * Don't forget the admin permission

## Formatting

* Run `npm run test` (from the plugin directory)
  * If you get `Error: Cannot find module '<project root>\node_modules\eslint\bin\eslint'`
    * Run `npm install`
  * If it finds any formatting errors you can try and automatically fix them with:
    * `node node_modules/eslint/bin/eslint <file-path> --fix`
  * Otherwise, please manually fix the error before commiting

## Testing

This plugin has [cordova-plugin-test-framework](https://github.com/apache/cordova-plugin-test-framework) tests.

To run these tests you can follow one of the below instructions:

* [Use your existing Cordova project](https://github.com/apache/cordova-plugin-test-framework)
  * Will kind of mess up your project
  * Probably will have to delete + re-create the platform folder when done at least
* [Use an empty project](https://github.com/miloproductionsinc/cordova-plugin-test-project) (recommended)
  * Keep your project clean
  * Most of the setup is done for you already



