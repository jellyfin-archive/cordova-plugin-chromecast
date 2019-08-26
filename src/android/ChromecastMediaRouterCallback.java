package acidhax.cordova.chromecast;

import androidx.mediarouter.media.MediaRouter;
import androidx.mediarouter.media.MediaRouter.RouteInfo;

public class ChromecastMediaRouterCallback extends MediaRouter.Callback {

	private Chromecast callback = null;

	public ChromecastMediaRouterCallback(Chromecast instance) {
		this.callback = instance;
	}


	@Override
	public synchronized void onRouteAdded(MediaRouter router, RouteInfo route) {
		if (this.callback != null) {
			this.callback.onRouteAdded(router, route);
		}
	}

	@Override
	public void onRouteRemoved(MediaRouter router, RouteInfo route) {
		if (this.callback != null) {
			this.callback.onRouteRemoved(router, route);
		}
	}

	@Override
	public void onRouteUnselected(MediaRouter router, RouteInfo route, int reason) {
		super.onRouteUnselected(router, route, reason);
		if (this.callback != null) {
			this.callback.onRouteUnselected(router, route, reason);
		}
	}
}
