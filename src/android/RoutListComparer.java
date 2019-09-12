package acidhax.cordova.chromecast;

import androidx.mediarouter.media.MediaRouter;

import java.util.Comparator;

public class RoutListComparer implements Comparator<MediaRouter.RouteInfo> {
    public int compare(MediaRouter.RouteInfo left, MediaRouter.RouteInfo right) {
        return left.getName().compareTo(right.getName());
    }
}
