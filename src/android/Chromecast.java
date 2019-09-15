package acidhax.cordova.chromecast;

import android.annotation.TargetApi;
import android.os.Build;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Type;
import java.util.List;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.LOG;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import androidx.mediarouter.media.MediaRouter.RouteInfo;

import com.google.android.gms.cast.CastDevice;
import com.google.android.gms.cast.framework.CastSession;

public final class Chromecast extends CordovaPlugin {

    /** Tag for logging. */
    private static final String TAG = "Chromecast";
    /** Object to control the connection to the chromecast. */
    private ChromecastConnection connection;
    /** Object to control the media. */
    private ChromecastSession media;
    /** Holds the reference to the current client initiated scan. */
    private ChromecastConnection.ScanCallback clientScan;

    @Override
    protected void pluginInitialize() {
        super.pluginInitialize();

        this.media = new ChromecastSession(cordova.getActivity(), new ChromecastSession.Listener() {
            @Override
            public void onSessionRejoined(JSONObject jsonSession) {
                sendJavascript("chrome.cast._.sessionListener(" + jsonSession + ");");
            }
            @Override
            public void onSessionUpdate(JSONObject jsonSession) {
                sendJavascript("chrome.cast._.sessionUpdated(" + jsonSession + ");");
            }
            @Override
            public void onReceiverAvailableUpdate(boolean available) {
                sendJavascript("chrome.cast._.receiverUpdate(" + available + ")");
            }
            @Override
            public void onMediaLoaded(JSONObject jsonMedia) {
                sendJavascript("chrome.cast._.mediaLoaded(" + jsonMedia + ");");
            }
            @Override
            public void onMediaUpdate(JSONObject jsonMedia) {
                sendJavascript("chrome.cast._.mediaUpdated(true, " + jsonMedia + ");");
            }
            @Override
            public void onMessageReceived(CastDevice device, String namespace, String message) {
                try {
                    JSONObject jsonMessage = new JSONObject(message);
                    sendJavascript(
                            "chrome.cast._.onMessage('" + namespace + "', '" + jsonMessage + "')");
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
        this.connection = new ChromecastConnection(cordova.getActivity(), this.media);
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext cbContext) throws JSONException {
        try {
            Method[] list = this.getClass().getMethods();
            Method methodToExecute = null;
            for (Method method : list) {
                if (method.getName().equals(action)) {
                    Type[] types = method.getGenericParameterTypes();
                    // +1 is the cbContext
                    if (args.length() + 1 == types.length) {
                        boolean isValid = true;
                        for (int i = 0; i < args.length(); i++) {
                            // Handle null/undefined arguments
                            if (JSONObject.NULL.equals(args.get(i))) {
                                continue;
                            }
                            Class arg = args.get(i).getClass();
                            if (types[i] != arg) {
                                isValid = false;
                                break;
                            }
                        }
                        if (isValid) {
                            methodToExecute = method;
                            break;
                        }
                    }
                }
            }
            if (methodToExecute != null) {
                Type[] types = methodToExecute.getGenericParameterTypes();
                Object[] variableArgs = new Object[types.length];
                for (int i = 0; i < args.length(); i++) {
                    variableArgs[i] = args.get(i);
                    // Translate null JSONObject to null
                    if (JSONObject.NULL.equals(variableArgs[i])) {
                        variableArgs[i] = null;
                    }
                }
                variableArgs[variableArgs.length - 1] = cbContext;
                Class<?> r = methodToExecute.getReturnType();
                if (r == boolean.class) {
                    return (Boolean) methodToExecute.invoke(this, variableArgs);
                } else {
                    methodToExecute.invoke(this, variableArgs);
                    return true;
                }
            } else {
                return false;
            }
        } catch (IllegalAccessException e) {
            e.printStackTrace();
            return false;
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            return false;
        } catch (InvocationTargetException e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Do everything you need to for "setup" - calling back sets the isAvailable and lets every function on the
     * javascript side actually do stuff.
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean setup(CallbackContext callbackContext) {
        callbackContext.success();
        return true;
    }

    /**
     * Initialize all of the MediaRouter stuff with the AppId.
     * For now, ignore the autoJoinPolicy and defaultActionPolicy; those will come later
     * @param appId               The appId we're going to use for ALL session requests
     * @param autoJoinPolicy      tab_and_origin_scoped | origin_scoped | page_scoped
     * @param defaultActionPolicy create_session | cast_this_tab
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean initialize(final String appId, String autoJoinPolicy, String defaultActionPolicy, final CallbackContext callbackContext) {
        connection.initialize(appId, callbackContext);
        return true;
    }

    /**
     * Request the session for the previously sent appId.
     * THIS IS WHAT LAUNCHES THE CHROMECAST PICKER
     * or, if we already have a session launch the connection options
     * dialog which will have the option to stop casting at minimum.
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean requestSession(final CallbackContext callbackContext) {
        connection.showConnectionDialog(new ChromecastConnection.JoinCallback() {
            @Override
            public void onJoin(CastSession session) {
                callbackContext.success(ChromecastSession.createSessionObject(session));
            }
            public void onError(String errorCode) {
                if (errorCode.equals("CANCEL")) {
                    callbackContext.error("cancel");
                } else {
                    // TODO maybe handle some of the error codes better
                    callbackContext.error("session_error");
                }
            }
        });
        return true;
    }

    /**
     * Selects a route by its id.
     * @param routeId the id of the route to join
     * @param routeName the name of the route
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean selectRoute(final String routeId, final String routeName, final CallbackContext callbackContext) {
        connection.join(routeId, routeName, new ChromecastConnection.JoinCallback() {
            @Override
            public void onJoin(CastSession castSession) {
                callbackContext.success(ChromecastSession.createSessionObject(castSession));
            }

            @Override
            public void onError(String errorCode) {
                callbackContext.error(errorCode);
            }
        });
        return true;
    }

    /**
     * Set the volume level on the receiver - this is a Chromecast volume, not a Media volume.
     * @param newLevel the level to set the volume to
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean setReceiverVolumeLevel(Integer newLevel, CallbackContext callbackContext) {
        return this.setReceiverVolumeLevel(newLevel.doubleValue(), callbackContext);
    }

    /**
     * Set the volume level on the receiver - this is a Chromecast volume, not a Media volume.
     * @param newLevel the level to set the volume to
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean setReceiverVolumeLevel(Double newLevel, CallbackContext callbackContext) {
        this.media.setVolume(newLevel, callbackContext);
        return true;
    }

    /**
     * Sets the muted boolean on the receiver - this is a Chromecast mute, not a Media mute.
     * @param muted if true set the media to muted, else, unmute
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean setReceiverMuted(Boolean muted, CallbackContext callbackContext) {
        this.media.setMute(muted, callbackContext);
        return true;
    }

    /**
     * Send a custom message to the receiver - we don't need this just yet... it was just simple to implement on the js side.
     * @param namespace namespace
     * @param message the message to send
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean sendMessage(String namespace, String message, final CallbackContext callbackContext) {
        this.media.sendMessage(namespace, message, callbackContext);
        return true;
    }

    /**
     * Adds a listener to a specific namespace.
     * @param namespace namespace
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean addMessageListener(String namespace, CallbackContext callbackContext) {
        this.media.addMessageListener(namespace);
        callbackContext.success();
        return true;
    }

    /**
     * Loads some media on the Chromecast using the media APIs.
     * @param contentId               The URL of the media item
     * @param customData              CustomData
     * @param contentType             MIME type of the content
     * @param duration                Duration of the content
     * @param streamType              buffered | live | other
     * @param autoPlay                Whether or not to automatically start playing the media
     * @param currentTime             Where to begin playing from
     * @param metadata                Metadata
     * @param textTrackStyle          The text track style
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean loadMedia(String contentId, JSONObject customData, String contentType, Integer duration, String streamType, Boolean autoPlay, Integer currentTime, JSONObject metadata, JSONObject textTrackStyle, final CallbackContext callbackContext) {
        return this.loadMedia(contentId, customData, contentType, duration, streamType, autoPlay, new Double(currentTime.doubleValue()), metadata, textTrackStyle, callbackContext);
    }

    private boolean loadMedia(String contentId, JSONObject customData, String contentType, Integer duration, String streamType, Boolean autoPlay, Double currentTime, JSONObject metadata, JSONObject textTrackStyle, final CallbackContext callbackContext) {
        this.media.loadMedia(contentId, customData, contentType, duration, streamType, autoPlay, currentTime, metadata, textTrackStyle, callbackContext);
        return true;
    }

    /**
     * Play on the current media in the current session.
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean mediaPlay(CallbackContext callbackContext) {
        media.mediaPlay(callbackContext);
        return true;
    }

    /**
     * Pause on the current media in the current session.
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean mediaPause(CallbackContext callbackContext) {
        media.mediaPause(callbackContext);
        return true;
    }

    /**
     * Seeks the current media in the current session.
     * @param seekTime - Seconds to seek to
     * @param resumeState  - Resume state once seeking is complete: PLAYBACK_PAUSE or PLAYBACK_START
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean mediaSeek(Integer seekTime, String resumeState, CallbackContext callbackContext) {
        media.mediaSeek(seekTime.longValue() * 1000, resumeState, callbackContext);
        return true;
    }


    /**
     * Set the volume level and mute state on the media.
     * @param level the level to set the volume to
     * @param muted if true set the media to muted, else, unmute
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean setMediaVolume(Integer level, Boolean muted, CallbackContext callbackContext) {
        return this.setMediaVolume(level.doubleValue(), muted, callbackContext);
    }

    /**
     * Set the volume level and mute state on the media.
     * @param level the level to set the volume to
     * @param muted if true set the media to muted, else, unmute
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean setMediaVolume(Double level, Boolean muted, CallbackContext callbackContext) {
        media.mediaSetVolume(level, muted, callbackContext);
        return true;
    }

    /**
     * Stops the current media.
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean mediaStop(CallbackContext callbackContext) {
        media.mediaStop(callbackContext);
        return true;
    }

    /**
     * Handle Track changes.
     * @param activeTrackIds  track Ids to set.
     * @param textTrackStyle  text track style to set.
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean mediaEditTracksInfo(JSONArray activeTrackIds, JSONObject textTrackStyle, final CallbackContext callbackContext) {
        long[] trackIds = new long[activeTrackIds.length()];

        try {
            for (int i = 0; i < activeTrackIds.length(); i++) {
                trackIds[i] = activeTrackIds.getLong(i);
            }
        } catch (JSONException ignored) {
            LOG.e(TAG, "Wrong format in activeTrackIds");
        }

        this.media.mediaEditTracksInfo(trackIds, textTrackStyle, callbackContext);
        return true;
    }

    /**
     * Stops the session.
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean sessionStop(CallbackContext callbackContext) {
        connection.endSession(true, callbackContext);
        return true;
    }

    /**
     * Stops the session.
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean sessionLeave(CallbackContext callbackContext) {
        connection.endSession(false, callbackContext);
        return true;
    }

    /**
     * Will actively scan for routes and send a json array to the client.
     * It is super important that client calls "stopScan", otherwise the
     * battery could drain quickly.
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean startRouteScan(CallbackContext callbackContext) {
        if (clientScan != null) {
            // Stop any other existing clientScan
            connection.stopScan(clientScan);
        }
        clientScan = new ChromecastConnection.ScanCallback() {
            @Override
            void onRouteUpdate(List<RouteInfo> routes) {
                PluginResult pluginResult = new PluginResult(PluginResult.Status.OK, routesToJSON(routes));
                pluginResult.setKeepCallback(true);
                callbackContext.sendPluginResult(pluginResult);
            }
        };
        connection.scanForRoutes(null, clientScan, null);

        return true;
    }

    /**
     * Stops the scan started by startRouteScan.
     * @param callbackContext called with .success or .error depending on the result
     * @return true for cordova
     */
    public boolean stopRouteScan(CallbackContext callbackContext) {
        if (clientScan != null) {
            // Stop any other existing clientScan
            connection.stopScan(clientScan);
        }
        callbackContext.success();
        return true;
    }

    /**
     * Simple helper to convert a route to JSON for passing down to the javascript side.
     * @param routes the routes to convert
     * @return a JSON Array of JSON representations of the routes
     */
    private JSONArray routesToJSON(List<RouteInfo> routes) {
        JSONArray routesArray = new JSONArray();
        for (RouteInfo route : routes) {
            try {
                JSONObject obj = new JSONObject();
                obj.put("name", route.getName());
                obj.put("id", route.getId());

                CastDevice device = CastDevice.getFromBundle(route.getExtras());
                if (device != null) {
                    obj.put("isNearbyDevice", !device.isOnLocalNetwork());
                }

                routesArray.put(obj);
            } catch (JSONException e) {
            }
        }
        return routesArray;
    }

    //Change all @deprecated this.webView.sendJavascript(String) to this local function sendJavascript(String)
    @TargetApi(Build.VERSION_CODES.KITKAT)
    private void sendJavascript(final String javascript) {
        webView.getView().post(new Runnable() {
            public void run() {
                // See: https://github.com/GoogleChrome/chromium-webview-samples/blob/master/jsinterface-example/app/src/main/java/jsinterfacesample/android/chrome/google/com/jsinterface_example/MainFragment.java
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                    webView.sendJavascript(javascript);
                } else {
                    webView.loadUrl("javascript:" + javascript);
                }
            }
        });
    }
}
