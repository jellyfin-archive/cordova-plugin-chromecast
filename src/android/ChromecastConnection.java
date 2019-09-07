package acidhax.cordova.chromecast;

import android.app.Activity;
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

public class ChromecastConnection {

	// Lifetime variables
	private Activity activity;
	private ChromecastSession media;
	private SessionListener newConnectionListener;

	// initialize lifetime variables
	private String appId;

	// session lifetime variables
	private CastSession session;

	public ChromecastConnection(Activity activity, ChromecastSession media, ConnectionListener listener) {
		this.activity = activity;
		this.media = media;

		// Add the session end/disconnect listener
		activity.runOnUiThread(new Runnable() {
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
	 * @param appId
	 * @param callback
	 */
	public void initialize(String appId, Callback callback) {
		// If the appId changed
		if (!appId.equals(this.appId)) {
			// Else we need to save the new appId
			this.setAppId(appId);
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

	private void setAppId(String appId) {
		this.appId = appId;
	}

	private void setSession(CastSession castSession) {
		this.session = castSession;
		this.media.setSession(this.session);
	}

	/**
	 * Attempts to join the last route we were connected to.
	 *
	 * @param callback
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
	 * @param routeId
	 * @param callback
	 */
	public void join(String routeId, JoinCallback callback) {
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
				// Not sure of this one's purpose, possibly just for display
				// castIntent.putExtra("CAST_INTENT_TO_CAST_DEVICE_NAME_KEY", deviceName);
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
	 * @param callback
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
					// TODO
				}
			}
		});
	}

	/**
	 * Must be called from the main thread
	 * @param callback
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
	 * @param callback
	 */
	public void scanForRoutes(ScanCallback callback) {
		// Add the callback in active scan mode
		activity.runOnUiThread(new Runnable() {
			public void run() {

				// Send out the initial routes
				for (RouteInfo route : getMediaRouter().getRoutes()) {
					callback.onFilteredRouteUpdate(route);
				}

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
	 */
	public void stopScan(ScanCallback callback) {
		activity.runOnUiThread(new Runnable() {
			public void run() {
				callback.stop();
				getMediaRouter().removeCallback(callback);
			}
		});
	}

	public void leave() {
		activity.runOnUiThread(new Runnable() {
			public void run() {
				setSession(null);
				getMediaRouter().unselect(MediaRouter.UNSELECT_REASON_DISCONNECTED);
			}
		});
	}

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
		void run();
	}
	
	public interface ConnectionListener {
		/**
		 * Called whenever a connection ends
		 */
		void onDisconnected(int reason);
	}

	public interface JoinCallback {
		/**
		 * Successfully joined a session on a route.
		 */
		void onJoin(CastSession session);

		/**
		 * @param errorCode "CANCEL" means the user cancelled
		 *                  If the errorCode is an integer, you can find the meaning here:
		 *                 https://developers.google.com/android/reference/com/google/android/gms/cast/CastStatusCodes
		 */
		void onError(String errorCode);
	}

	public static abstract class ScanCallback extends MediaRouter.Callback {
		abstract void onRouteUpdate(RouteInfo route);

		private boolean stopped = false;
		void stop() {
			stopped = true;
		}
		private void onFilteredRouteUpdate(RouteInfo route) {
			if (stopped) {
				return;
			}
			if (!route.isDefault()) {
				onRouteUpdate(route);
			}
		}
		@Override
		public void onRouteAdded(MediaRouter router, RouteInfo route) {
			onFilteredRouteUpdate(route);
		}
		@Override
		public void onRouteChanged(MediaRouter router, RouteInfo route) {
			onFilteredRouteUpdate(route);
		}
		@Override
		public void onRouteRemoved(MediaRouter router, RouteInfo route) {
			onFilteredRouteUpdate(route);
		}
	}

}
