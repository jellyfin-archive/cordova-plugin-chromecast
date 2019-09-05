package acidhax.cordova.chromecast;

import android.app.Activity;
import android.content.DialogInterface;
import android.os.Handler;

import androidx.mediarouter.app.MediaRouteChooserDialog;
import androidx.mediarouter.media.MediaRouteSelector;
import androidx.mediarouter.media.MediaRouter;
import androidx.mediarouter.media.MediaRouter.RouteInfo;

import com.google.android.gms.cast.CastMediaControlIntent;

import java.util.List;

public class ChromecastMediaRouterManager {

	private Activity mActivity;
	private String mAppId;
	private volatile MediaRouter mMediaRouter;
	private volatile MediaRouteSelector mMediaRouteSelector;
	private MediaRouter.Callback mMediaRouterCallback;
	private volatile boolean mDialogCancelled;

	public ChromecastMediaRouterManager(Activity context, MediaRouter.Callback mediaRouterCallback) {
		mActivity = context;
		mMediaRouterCallback = mediaRouterCallback;
	}

	/**
	 * Actively searches for a valid receiver for appId for seekDuration.
	 * This uses lots of battery power, so it's best to limit the search time.
	 * @param appId
	 * @param seekDuration (milli seconds)
	 * @param callback
	 */
	public void scanForReceiver(String appId, int seekDuration, ScanCallback callback) {
		mActivity.runOnUiThread(new Runnable() {
			public void run() {
				synchronized(ChromecastMediaRouterManager.class) {

					boolean appIdIsSame = appId.equals(mAppId);
					mAppId = appId;

					// Ensure the media router exists
					if (mMediaRouter == null) {
						// We need to initialize the router exists
						mMediaRouter = MediaRouter.getInstance(mActivity);
					}

					if (appIdIsSame && isRouteAvailable()) {
						// In this case, it most likely this the user navigated to a new page and called api initialize again.
						// To replicate chrome desktop behavior, we must manually send the receiver available update.
						// Scan will not find a new route since we already have one.
						callback.onFoundReceiver();

					} else {
						// Else, scan because, the app Id has changed, this is our first time here, or no routes are known

						// Update/create the route selector as needed
						if (!appIdIsSame || mMediaRouteSelector == null) {
							mMediaRouteSelector = new MediaRouteSelector.Builder()
									.addControlCategory(CastMediaControlIntent.categoryForCast(appId))
									.build();
						}

						// Add a callback that will solely search for receivers.
						// We will remove the active seeking callback after it finds a route or
						// after seekDuration.  It uses a lot of power.  We will then add a less
						// power-hungry callback.

						// Create our route detection callback
						MediaRouter.Callback routeChangedCallback = new MediaRouter.Callback() {
							@Override
							public void onRouteChanged(MediaRouter router, RouteInfo route) {
								super.onRouteChanged(router, route);
								if (isRouteAvailable()) {
									callback.onFoundReceiver();
									mMediaRouter.removeCallback(this);
								}
							}
						};

						// Create and start our timeout
						final Handler handler = new Handler();
						final Runnable r = new Runnable() {
							@Override
							public void run() {
								// Quit scanning
								mMediaRouter.removeCallback(routeChangedCallback);
							}
						};
						handler.postDelayed(r, seekDuration);

						// Add the callback in active scan mode
						mMediaRouter.addCallback(mMediaRouteSelector, routeChangedCallback, MediaRouter.CALLBACK_FLAG_PERFORM_ACTIVE_SCAN);
					}
				}

			}
		});
	}

	public void showRouteSelectionDialog(DialogCallback callback) {
		mDialogCancelled = false;

		mActivity.runOnUiThread(new Runnable() {
			public void run() {

				// Create the dialog
				// TODO accept theme as a config.xml option
				MediaRouteChooserDialog builder = new MediaRouteChooserDialog(mActivity, androidx.appcompat.R.style.Theme_AppCompat_NoActionBar);
				builder.setRouteSelector(mMediaRouteSelector);
				builder.setCanceledOnTouchOutside(true);
				builder.setOnCancelListener(new DialogInterface.OnCancelListener() {
					@Override
					public void onCancel(DialogInterface dialog) {
						mDialogCancelled = true;
					}
				});
				builder.setOnDismissListener(new DialogInterface.OnDismissListener() {
					@Override
					public void onDismiss(DialogInterface dialog) {
						RouteInfo route = mMediaRouter.getSelectedRoute();
						if (mDialogCancelled) {
							callback.onError("CANCEL");
						} else if (route.isDefault()) {
							callback.onError("RECEIVER_UNAVAILABLE");
						} else {
							callback.onConnect(route);
						}
					}
				});

				builder.show();
			}
		});
	}

	/**
	 * Checks if it appears that any routes are available.
	 * @return True, if there has been a receiver available (it is possible that it has been disconnected).
	 *         False, if there has been no confirmed receiver.
	 */
	public boolean isRouteAvailable() {
		if (mMediaRouter != null && mMediaRouteSelector != null) {
			return mMediaRouter.isRouteAvailable(mMediaRouteSelector, MediaRouter.AVAILABILITY_FLAG_IGNORE_DEFAULT_ROUTE);
		}
		return false;
	}

	public List<RouteInfo> getRoutes() {
		return mMediaRouter.getRoutes();
	}

	public static class ScanCallback {
		void onFoundReceiver() {}
	}

	public static class DialogCallback {
		void onConnect(RouteInfo route) {}
		void onError(String errorCode) {}
	}
}
