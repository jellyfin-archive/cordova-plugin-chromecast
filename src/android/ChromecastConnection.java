package acidhax.cordova.chromecast;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Handler;

import androidx.mediarouter.app.MediaRouteChooserDialog;
import androidx.mediarouter.media.MediaRouteSelector;
import androidx.mediarouter.media.MediaRouter;
import androidx.mediarouter.media.MediaRouter.RouteInfo;

import com.google.android.gms.cast.CastDevice;
import com.google.android.gms.cast.CastMediaControlIntent;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.CastState;
import com.google.android.gms.cast.framework.CastStateListener;
import com.google.android.gms.cast.framework.SessionManager;
import com.google.android.gms.cast.framework.SessionManagerListener;

import org.apache.cordova.CallbackContext;

import java.util.ArrayList;
import java.util.List;

public class ChromecastConnection {

    /** Lifetime variable. */
    private Activity activity;
    /** settings object. */
    private SharedPreferences settings;
    /** Lifetime variable. */
    private ChromecastSession media;
    /** Lifetime variable. */
    private SessionListener newConnectionListener;
    /** Should we pass disconnects to the client's externalDisconnectListener. */
    private boolean enableClientExtenalDisconnectListener = true;
    /** The ReceiverListener callback. */
    private ReceiverListener receiverListener;

    /** Initialize lifetime variable. */
    private String appId;

    /** Session lifetime variable. */
    private CastSession session;

    /**
     * Constructor.
     * @param act the current context
     * @param chromecastSession the chromecastSession object that we should load with a new sessions
     * @param listener the listener that listens for session end event
     */
    public ChromecastConnection(Activity act, ChromecastSession chromecastSession, Callback listener) {
        this.activity = act;
        this.settings = activity.getSharedPreferences("CORDOVA-PLUGIN-CHROMECAST_ChromecastConnection", 0);
        this.media = chromecastSession;
        this.appId = settings.getString("appId", CastMediaControlIntent.DEFAULT_MEDIA_RECEIVER_APPLICATION_ID);
        // Set the initial appId
        CastOptionsProvider.setAppId(appId);
        // Set the receiverLister to an empty default (saves us some null check later)
        this.setReceiverListener(null);

        // Add the permanent session end/disconnect, and resume listener, and receiver update listener
        getSessionManager().addSessionManagerListener(new SessionListener() {
            @Override
            public void onSessionEnded(CastSession castSession, int error) {
                setSession(null);
                if (listener != null && enableClientExtenalDisconnectListener) {
                    listener.run();
                }
            }
            @Override
            public void onSessionResumed(CastSession castSession, boolean wasSuspended) {
                // This catches any sessions we are able to rejoin
                setSession(castSession);
            }
        }, CastSession.class);

        // This is the first call to getContext which will start up the
        // CastContext and prep it for searching for a session to rejoin
        getContext().addCastStateListener(new CastStateListener() {
            @Override
            public void onCastStateChanged(int i) {
                receiverListener.sendUpdate(i);
            }
        });
    }

    /**
     * Must be called each time the appId changes and at least once before any other method is called.
     * @param applicationId the app id to use
     * @param callback called when initialization is complete
     * @param onSessionFound called when (if) an active session is found
     */
    public void initialize(String applicationId, CallbackContext callback, Callback onSessionFound) {
        activity.runOnUiThread(new Runnable() {
            public void run() {

                // If the app Id changed, get it again
                if (!applicationId.equals(appId)) {
                    setAppId(applicationId);
                }

                // Tell the client that initialization was a success
                callback.success();

                lookForAvailableReceiver(new Callback() {
                    @Override
                    public void run() {
                        // Update the session
                        setSession(getSessionManager().getCurrentCastSession());
                        if (session != null) {
                            // Let the client know we have found a session
                            onSessionFound.run();
                        }
                    }
                });
            }
        });
    }

    /**
     * Must be called from the main thread.
     * @param foundReceiver called if a receiver is found
     */
    private void lookForAvailableReceiver(Callback foundReceiver) {
        // check current state
        if (ReceiverListener.isReceiverAvailable(getContext().getCastState())) {
            // If we already have a receiver, notify and return
            receiverListener.sendUpdate(getContext().getCastState());
            foundReceiver.run();
            return;
        }

        // Create callbacks
        MediaRouter.Callback mediaRouterCallback = new MediaRouter.Callback() { };
        CastStateListener castStateListener = new CastStateListener() {
            @Override
            public void onCastStateChanged(int state) {
                if (ReceiverListener.isReceiverAvailable(state)) {
                    // Remove callbacks
                    getContext().removeCastStateListener(this);
                    getMediaRouter().removeCallback(mediaRouterCallback);
                    // And let the client know we found a receiver
                    foundReceiver.run();
                }
            }
        };

        // Listen for any available receiver
        getContext().addCastStateListener(castStateListener);


        // Start an active scan for available routes
        getMediaRouter().addCallback(new MediaRouteSelector.Builder()
                        .addControlCategory(CastMediaControlIntent.categoryForCast(appId))
                        .build(),
                mediaRouterCallback,
                MediaRouter.CALLBACK_FLAG_PERFORM_ACTIVE_SCAN);

        // If we didn't find any routes by 5 seconds remove the callbacks
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                // And stop the scan for routes
                getMediaRouter().removeCallback(mediaRouterCallback);
                // And remove the castStateListener callback
                getContext().removeCastStateListener(castStateListener);
            }
        }, 5000);
    }

    private MediaRouter getMediaRouter() {
        return MediaRouter.getInstance(activity);
    }

    private CastContext getContext() {
        return CastContext.getSharedInstance(activity);
    }

    private SessionManager getSessionManager() {
        return getContext().getSessionManager();
    }

    private void setAppId(String applicationId) {
        this.appId = applicationId;
        this.settings.edit().putString("appId", appId).apply();
        getContext().setReceiverApplicationId(appId);
        // Invalidate any old session
        this.setSession(null);
    }

    private void setSession(CastSession castSession) {
        this.session = castSession;
        this.media.setSession(this.session);
    }

    /**
     * This will create a new session or seamlessly join an existing one if we created it.
     * @param routeId the id of the route to join
     * @param routeName the name of the route
     * @param callback calls callback.onJoin when we have joined a session,
     *                 or callback.onError if an error occurred
     */
    public void join(final String routeId, final String routeName, JoinCallback callback) {
        activity.runOnUiThread(new Runnable() {
            public void run() {
                if (session != null) {
                    // We are are already connected to a route
                    callback.onJoin(session);
                    return;
                }
                listenForConnection(callback);

                Intent castIntent = new Intent();
                castIntent.putExtra("CAST_INTENT_TO_CAST_ROUTE_ID_KEY", routeId);
                // RouteName and toast are just for display
                castIntent.putExtra("CAST_INTENT_TO_CAST_DEVICE_NAME_KEY", routeName);
                castIntent.putExtra("CAST_INTENT_TO_CAST_NO_TOAST_KEY", false);

                getSessionManager().startSession(castIntent);
            }
        });
    }

    /**
     * Will do one of two things:
     *
     * If no current connection will:
     * 1)
     * Displays the built in native prompt to the user.
     * It will actively scan for routes and display them to the user.
     * Upon selection it will immediately attempt to join the route.
     * Will call onJoin or onError of callback.
     *
     * Else we have a connection, so:
     * 2)
     * Displays the active connection dialog which includes the option
     * to disconnect.
     * Will only call onError of callback if the user cancels the dialog.
     *
     * @param callback calls callback.success when we have joined a session,
     *                 or callback.error if an error occurred or if the dialog was dismissed
     */
    public void showConnectionDialog(JoinCallback callback) {
        activity.runOnUiThread(new Runnable() {
            public void run() {
                if (session == null) {
                    // show the "choose a connection" dialog

                    // Add the connection listener callback
                    listenForConnection(callback);

                    // Create the dialog
                    // TODO accept theme as a config.xml option
                    MediaRouteChooserDialog builder = new MediaRouteChooserDialog(activity, androidx.appcompat.R.style.Theme_AppCompat_NoActionBar);
                    builder.setRouteSelector(new MediaRouteSelector.Builder()
                            .addControlCategory(CastMediaControlIntent.categoryForCast(appId))
                            .build());
                    builder.setCanceledOnTouchOutside(true);
                    builder.setOnCancelListener(new DialogInterface.OnCancelListener() {
                        @Override
                        public void onCancel(DialogInterface dialog) {
                            getSessionManager().removeSessionManagerListener(newConnectionListener, CastSession.class);
                            callback.onError("CANCEL");
                        }
                    });
                    builder.show();
                } else {
                    // We are are already connected, so show the "connection options" Dialog
                    AlertDialog.Builder builder = new AlertDialog.Builder(activity);
                    if (session.getCastDevice() != null) {
                        builder.setTitle(session.getCastDevice().getFriendlyName());
                    }
                    builder.setOnDismissListener(new DialogInterface.OnDismissListener() {
                        @Override
                        public void onDismiss(DialogInterface dialog) {
                            callback.onError("CANCEL");
                        }
                    });
                    builder.setPositiveButton("Stop Casting", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialog, int which) {
                            endSession(true, null, null);
                        }
                    });
                    builder.show();
                }
            }
        });
    }

    /**
     * Must be called from the main thread.
     * @param callback calls callback.success when we have joined, or callback.error if an error occurred
     */
    private void listenForConnection(JoinCallback callback) {
        // We should only ever have one of these listeners active at a time, so remove previous
        getSessionManager().removeSessionManagerListener(newConnectionListener, CastSession.class);
        newConnectionListener = new SessionListener() {
            @Override
            public void onSessionStarted(CastSession castSession, String sessionId) {
                getSessionManager().removeSessionManagerListener(this, CastSession.class);
                setSession(castSession);
                callback.onJoin(session);
            }
            @Override
            public void onSessionStartFailed(CastSession castSession, int errCode) {
                getSessionManager().removeSessionManagerListener(this, CastSession.class);
                setSession(null);
                callback.onError(Integer.toString(errCode));
            }
        };
        getSessionManager().addSessionManagerListener(newConnectionListener, CastSession.class);
    }

    /**
     * Starts listening for receiver updates.
     * Must call stopScan(callback) or the battery will drain with non-stop active scanning.
     * @param callback the callback to receive route updates on
     */
    public void scanForRoutes(ScanCallback callback) {
        // Add the callback in active scan mode
        activity.runOnUiThread(new Runnable() {
            public void run() {
                callback.setMediaRouter(getMediaRouter());

                // Send out the initial routes
                callback.onFilteredRouteUpdate();

                // Add the callback in active scan mode
                getMediaRouter().addCallback(new MediaRouteSelector.Builder()
                        .addControlCategory(CastMediaControlIntent.categoryForCast(appId))
                        .build(),
                        callback,
                        MediaRouter.CALLBACK_FLAG_PERFORM_ACTIVE_SCAN);
            }
        });
    }

    /**
     * Call to stop the active scan if any exist.
     * @param callback the callback to stop and remove
     */
    public void stopScan(ScanCallback callback) {
        activity.runOnUiThread(new Runnable() {
            public void run() {
                callback.stop();
                getMediaRouter().removeCallback(callback);
            }
        });
    }

    /**
     * Exits the current session.
     * @param stopCasting should the receiver application  be stopped as well?
     * @param callback called with .success or .error depending on the initial result
     * @param disconnected overrides the default disconnect listener if set
     *                     only called once we actually disconnect
     */
    public void endSession(boolean stopCasting, CallbackContext callback, Callback disconnected) {
        activity.runOnUiThread(new Runnable() {
            public void run() {
                if (disconnected != null) {
                    // Disable the externalDisconnectListener temporarily
                    enableClientExtenalDisconnectListener = false;
                }

                getSessionManager().addSessionManagerListener(new SessionListener() {
                    @Override
                    public void onSessionEnded(CastSession castSession, int error) {
                        getSessionManager().removeSessionManagerListener(this, CastSession.class);
                        // Re-enable the externalDisconnectListener
                        enableClientExtenalDisconnectListener = true;
                        setSession(null);
                        if (disconnected != null) {
                            disconnected.run();
                        }
                    }
                }, CastSession.class);

                getSessionManager().endCurrentSession(stopCasting);
                if (callback != null) {
                    callback.success();
                }
            }
        });
    }

    /**
     * Sets the permanent ReceiverListener.
     * @param listener called when there are receiver updates
     */
    public void setReceiverListener(ReceiverListener listener) {
        if (listener != null) {
            this.receiverListener = listener;
        } else {
            // Make sure the receiverLister always has something
            this.receiverListener = new ReceiverListener() {
                @Override
                void onReceiverAvailable() {
                }
                @Override
                void onReceiverUnavailable() {
                }
            };
        }
    }

    private class SessionListener implements SessionManagerListener<CastSession> {

        @Override
        public void onSessionStarting(CastSession castSession) {
        }

        @Override
        public void onSessionStarted(CastSession castSession, String sessionId) {
        }

        @Override
        public void onSessionStartFailed(CastSession castSession, int error) {
        }

        @Override
        public void onSessionEnding(CastSession castSession) {
        }

        @Override
        public void onSessionEnded(CastSession castSession, int error) {
        }

        @Override
        public void onSessionResuming(CastSession castSession, String sessionId) {
        }

        @Override
        public void onSessionResumed(CastSession castSession, boolean wasSuspended) {
        }

        @Override
        public void onSessionResumeFailed(CastSession castSession, int error) {
        }

        @Override
        public void onSessionSuspended(CastSession castSession, int reason) {
        }
    }

    public interface Callback {
        /**
         * The callback function.
         */
        void run();
    }

    public interface ConnectionListener {
        /**
         * Called whenever a connection ends.
         * @param reason the reason for disconnection
         */
        void onDisconnected(int reason);
    }

    public interface JoinCallback {
        /**
         * Successfully joined a session on a route.
         * @param session the session we joined
         */
        void onJoin(CastSession session);

        /**
         * Called if we received an error.
         * @param errorCode "CANCEL" means the user cancelled
         *                  If the errorCode is an integer, you can find the meaning here:
         *                 https://developers.google.com/android/reference/com/google/android/gms/cast/CastStatusCodes
         */
        void onError(String errorCode);
    }

    public abstract static class ScanCallback extends MediaRouter.Callback {
        /**
         * Called whenever a route is updated.
         * @param routes the currently available routes
         */
        abstract void onRouteUpdate(List<RouteInfo> routes);

        /** records whether we have been stopped or not. */
        private boolean stopped = false;
        /** Global mediaRouter object. */
        private MediaRouter mediaRouter;

        /**
         * Sets the mediaRouter object.
         * @param router mediaRouter object
         */
        void setMediaRouter(MediaRouter router) {
            this.mediaRouter = router;
        }

        /**
         * Call this method when you wish to stop scanning.
         * It is important that it is called, otherwise battery
         * life will drain more quickly.
         */
        void stop() {
            stopped = true;
        }
        private void onFilteredRouteUpdate() {
            if (stopped || mediaRouter == null) {
                return;
            }
            List<RouteInfo> routes = mediaRouter.getRoutes();
            List<RouteInfo> outRoutes = new ArrayList<>();
            // Filter the routes
            for (RouteInfo route : routes) {
                // We don't want default routes, or duplicate active routes
                // or multizone duplicates https://github.com/jellyfin/cordova-plugin-chromecast/issues/32
                Bundle extras = route.getExtras();
                if (extras != null) {
                    CastDevice.getFromBundle(extras);
                    if (extras.getString("com.google.android.gms.cast.EXTRA_SESSION_ID") != null) {
                        continue;
                    }
                }
                if (!route.isDefault() && !route.getDescription().equals("Google Cast Multizone Member")) {
                    outRoutes.add(route);
                }
            }
            onRouteUpdate(outRoutes);
        }
        @Override
        public final void onRouteAdded(MediaRouter router, RouteInfo route) {
            onFilteredRouteUpdate();
        }
        @Override
        public final void onRouteChanged(MediaRouter router, RouteInfo route) {
            onFilteredRouteUpdate();
        }
        @Override
        public final void onRouteRemoved(MediaRouter router, RouteInfo route) {
            onFilteredRouteUpdate();
        }
    }

    abstract static class ReceiverListener {
        private static boolean isReceiverAvailable(int state) {
            return state != CastState.NO_DEVICES_AVAILABLE;
        }
        /**
         * Sends the appropriate update.
         * @param state CastState
         */
        private void sendUpdate(int state) {
            if (isReceiverAvailable(state)) {
                this.onReceiverAvailable();
            } else {
                this.onReceiverUnavailable();
            }
        }
        abstract void onReceiverAvailable();
        abstract void onReceiverUnavailable();
    }
}
