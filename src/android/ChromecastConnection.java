package acidhax.cordova.chromecast;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;

import androidx.mediarouter.app.MediaRouteChooserDialog;
import androidx.mediarouter.media.MediaRouteSelector;
import androidx.mediarouter.media.MediaRouter;
import androidx.mediarouter.media.MediaRouter.RouteInfo;

import com.google.android.gms.cast.CastMediaControlIntent;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.SessionManager;
import com.google.android.gms.cast.framework.SessionManagerListener;

import java.util.ArrayList;
import java.util.List;

public class ChromecastConnection {

    /** Lifetime variable. */
    private Activity activity;
    /** Lifetime variable. */
    private ChromecastSession media;
    /** Lifetime variable. */
    private SessionListener newConnectionListener;

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
    public ChromecastConnection(Activity act, ChromecastSession chromecastSession, ConnectionListener listener) {
        this.activity = act;
        this.media = chromecastSession;

        // Add the session end/disconnect listener
        act.runOnUiThread(new Runnable() {
            public void run() {
                getSessionManager().addSessionManagerListener(new SessionListener() {
                    @Override
                    public void onSessionEnded(CastSession castSession, int error) {
                        setSession(null);
                        if (listener != null) {
                            listener.onDisconnected(error);
                        }
                    }
                }, CastSession.class);
            }
        });
    }

    /**
     * Must be called each time the appId changes and at least once before any other method is called.
     * @param applicationId the app id to use
     * @param callback called when initialization is complete
     */
    public void initialize(String applicationId, Callback callback) {
        // If the appId changed
        if (!applicationId.equals(this.appId)) {
            // Else we need to save the new appId
            this.setAppId(applicationId);
            // And reset the session
            this.setSession(null);
        }

        activity.runOnUiThread(new Runnable() {
            public void run() {
                // Set the new appId
                CastContext.getSharedInstance(activity).setReceiverApplicationId(appId);
                // Tell the client we are done
                callback.run();
            }
        });
    }

    private MediaRouter getMediaRouter() {
        return MediaRouter.getInstance(activity);
    }

    private SessionManager getSessionManager() {
        return CastContext.getSharedInstance(activity).getSessionManager();
    }

    private void setAppId(String applicationId) {
        this.appId = applicationId;
    }

    private void setSession(CastSession castSession) {
        this.session = castSession;
        this.media.setSession(this.session);
    }

    /**
     * Attempts to join the last route we were connected to.
     * @param callback calls callback.onJoin if we have joined a session
     */
    public void rejoin(JoinCallback callback) {
        if (session != null) {
            callback.onJoin(session);
        }
        // TODO is it even possible to rejoin a session automatically?
        //  https://stackoverflow.com/questions/57801427/how-to-rejoin-cast-session-after-app-restart
        //  https://stackoverflow.com/questions/57832467/how-to-check-if-mediarouter-routeinfo-route-is-already-in-use
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
                    builder.setTitle(session.getCastDevice().getFriendlyName());
                    builder.setOnDismissListener(new DialogInterface.OnDismissListener() {
                        @Override
                        public void onDismiss(DialogInterface dialog) {
                            callback.onError("CANCEL");
                        }
                    });
                    builder.setPositiveButton("Stop Casting", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialog, int which) {
                            kill();
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
     * Leaves the session.
     */
    public void leave() {
        activity.runOnUiThread(new Runnable() {
            public void run() {
                setSession(null);
                getMediaRouter().unselect(MediaRouter.UNSELECT_REASON_DISCONNECTED);
            }
        });
    }

    /**
     * Kills the session.
     */
    public void kill() {
        activity.runOnUiThread(new Runnable() {
            public void run() {
                setSession(null);
                getSessionManager().endCurrentSession(true);
            }
        });
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
                // We don't want default routes
                // or multizone duplicates https://github.com/jellyfin/cordova-plugin-chromecast/issues/32
                if (!route.isDefault()) {
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

}
