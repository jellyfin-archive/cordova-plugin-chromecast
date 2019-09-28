package acidhax.cordova.chromecast;

import android.graphics.Color;

import androidx.mediarouter.media.MediaRouter;

import com.google.android.gms.cast.CastDevice;
import com.google.android.gms.cast.MediaInfo;
import com.google.android.gms.cast.MediaMetadata;
import com.google.android.gms.cast.MediaStatus;
import com.google.android.gms.cast.MediaTrack;
import com.google.android.gms.cast.TextTrackStyle;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.common.images.WebImage;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;

final class ChromecastUtilities {

    private ChromecastUtilities() {
        //not called
    }

    static String getMediaIdleReason(MediaStatus mediaStatus) {
        switch (mediaStatus.getIdleReason()) {
            case MediaStatus.IDLE_REASON_CANCELED:
                return "CANCELED";
            case MediaStatus.IDLE_REASON_ERROR:
                return "ERROR";
            case MediaStatus.IDLE_REASON_FINISHED:
                return "FINISHED";
            case MediaStatus.IDLE_REASON_INTERRUPTED:
                return "INTERRUPTED";
            case MediaStatus.IDLE_REASON_NONE:
                return "NONE";
            default:
                return null;
        }
    }

    static String getMediaPlayerState(MediaStatus mediaStatus) {
        switch (mediaStatus.getPlayerState()) {
            case MediaStatus.PLAYER_STATE_BUFFERING:
                return "BUFFERING";
            case MediaStatus.PLAYER_STATE_IDLE:
                return "IDLE";
            case MediaStatus.PLAYER_STATE_PAUSED:
                return "PAUSED";
            case MediaStatus.PLAYER_STATE_PLAYING:
                return "PLAYING";
            case MediaStatus.PLAYER_STATE_UNKNOWN:
                return "UNKNOWN";
            default:
                return null;
        }
    }

    static String getMediaInfoStreamType(MediaInfo mediaInfo) {
        switch (mediaInfo.getStreamType()) {
            case MediaInfo.STREAM_TYPE_BUFFERED:
                return "BUFFERED";
            case MediaInfo.STREAM_TYPE_LIVE:
                return "LIVE";
            case MediaInfo.STREAM_TYPE_NONE:
                return "OTHER";
            default:
                return null;
        }
    }

    static String getTrackType(MediaTrack track) {
        switch (track.getType()) {
            case MediaTrack.TYPE_AUDIO:
                return "AUDIO";
            case MediaTrack.TYPE_TEXT:
                return "TEXT";
            case MediaTrack.TYPE_VIDEO:
                return "VIDEO";
            default:
                return null;
        }
    }

    static String getTrackSubtype(MediaTrack track) {
        switch (track.getSubtype()) {
            case MediaTrack.SUBTYPE_CAPTIONS:
                return "CAPTIONS";
            case MediaTrack.SUBTYPE_CHAPTERS:
                return "CHAPTERS";
            case MediaTrack.SUBTYPE_DESCRIPTIONS:
                return "DESCRIPTIONS";
            case MediaTrack.SUBTYPE_METADATA:
                return "METADATA";
            case MediaTrack.SUBTYPE_SUBTITLES:
                return "SUBTITLES";
            case MediaTrack.SUBTYPE_NONE:
                return null;
            default:
                return null;
        }
    }

    static String getEdgeType(TextTrackStyle textTrackStyle) {
        switch (textTrackStyle.getEdgeType()) {
            case TextTrackStyle.EDGE_TYPE_DEPRESSED:
                return "DEPRESSED";
            case TextTrackStyle.EDGE_TYPE_DROP_SHADOW:
                return "DROP_SHADOW";
            case TextTrackStyle.EDGE_TYPE_OUTLINE:
                return "OUTLINE";
            case TextTrackStyle.EDGE_TYPE_RAISED:
                return "RAISED";
            case TextTrackStyle.EDGE_TYPE_NONE:
            default:
                return "NONE";
        }
    }

    static String getFontGenericFamily(TextTrackStyle textTrackStyle) {
        switch (textTrackStyle.getFontGenericFamily()) {
            case TextTrackStyle.FONT_FAMILY_CURSIVE:
                return "CURSIVE";
            case TextTrackStyle.FONT_FAMILY_MONOSPACED_SANS_SERIF:
                return "MONOSPACED_SANS_SERIF";
            case TextTrackStyle.FONT_FAMILY_MONOSPACED_SERIF:
                return "MONOSPACED_SERIF";
            case TextTrackStyle.FONT_FAMILY_SANS_SERIF:
                return "SANS_SERIF";
            case TextTrackStyle.FONT_FAMILY_SERIF:
                return "SERIF";
            case TextTrackStyle.FONT_FAMILY_SMALL_CAPITALS:
                return "SMALL_CAPITALS";
            default:
                return "SERIF";
        }
    }

    static String getFontStyle(TextTrackStyle textTrackStyle) {
        switch (textTrackStyle.getFontStyle()) {
            case TextTrackStyle.FONT_STYLE_NORMAL:
                return "NORMAL";
            case TextTrackStyle.FONT_STYLE_BOLD:
                return "BOLD";
            case TextTrackStyle.FONT_STYLE_BOLD_ITALIC:
                return "BOLD_ITALIC";
            case TextTrackStyle.FONT_STYLE_ITALIC:
                return "ITALIC";
            case TextTrackStyle.FONT_STYLE_UNSPECIFIED:
            default:
                return "NORMAL";
        }
    }

    static String getWindowType(TextTrackStyle textTrackStyle) {
        switch (textTrackStyle.getWindowType()) {
            case TextTrackStyle.WINDOW_TYPE_NORMAL:
                return "NORMAL";
            case TextTrackStyle.WINDOW_TYPE_ROUNDED:
                return "ROUNDED_CORNERS";
            case TextTrackStyle.WINDOW_TYPE_NONE:
            default:
                return "NONE";
        }
    }

    static TextTrackStyle parseTextTrackStyle(JSONObject textTrackSytle) {
        TextTrackStyle out = new TextTrackStyle();

        if (textTrackSytle == null) {
            return out;
        }

        try {
            if (!textTrackSytle.isNull("backgroundColor")) {
                out.setBackgroundColor(Color.parseColor(textTrackSytle.getString("backgroundColor")));
            }

            if (!textTrackSytle.isNull("edgeColor")) {
                out.setEdgeColor(Color.parseColor(textTrackSytle.getString("edgeColor")));
            }

            if (!textTrackSytle.isNull("foregroundColor")) {
                out.setForegroundColor(Color.parseColor(textTrackSytle.getString("foregroundColor")));
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }

        return out;
    }

    static String getHexColor(int color) {
        return "#" + Integer.toHexString(color);
    }

    static JSONObject createSessionObject(CastSession session, String state) {
        JSONObject s = createSessionObject(session);
        if (state != null) {
            try {
                s.put("status", state);
            } catch (JSONException e) {

            }
        }
        return s;
    }

    static JSONObject createSessionObject(CastSession session) {
        JSONObject out = new JSONObject();

        try {
            out.put("appId", session.getApplicationMetadata().getApplicationId());
            out.put("appImages", createAppImagesObject(session));
            out.put("displayName", session.getApplicationMetadata().getName());
            out.put("media", createMediaObject(session));
            out.put("receiver", createReceiverObject(session));
            out.put("sessionId", session.getSessionId());

        } catch (JSONException e) {
            e.printStackTrace();
        } catch (NullPointerException e) {

        }

        return out;
    }

    private static JSONArray createAppImagesObject(CastSession session) {
        JSONArray appImages = new JSONArray();
        try {
            MediaMetadata metadata = session.getRemoteMediaClient().getMediaInfo().getMetadata();
            List<WebImage> images = metadata.getImages();
            if (images != null) {
                for (WebImage o : images) {
                    appImages.put(o.toString());
                }
            }
        } catch (NullPointerException e) {

        }
        return appImages;
    }

    private static JSONObject createReceiverObject(CastSession session) {
        JSONObject out = new JSONObject();
        try {
            out.put("friendlyName", session.getCastDevice().getFriendlyName());
            out.put("label", session.getCastDevice().getDeviceId());

            JSONObject volume = new JSONObject();
            try {
                volume.put("level", session.getVolume());
                volume.put("muted", session.isMute());
            } catch (JSONException e) {

            }
            out.put("volume", volume);

        } catch (JSONException e) {

        } catch (NullPointerException e) {

        }
        return out;
    }

    static JSONObject createMediaObject(CastSession session) {
        JSONObject out = new JSONObject();

        try {
            MediaStatus mediaStatus = session.getRemoteMediaClient().getMediaStatus();

            // TODO: Missing attributes are commented out.
            //  These are returned by the chromecast desktop SDK, we should probbaly return them too
            //out.put("breakStatus",);
            out.put("currentItemId", mediaStatus.getCurrentItemId());
            out.put("currentTime", mediaStatus.getStreamPosition() / 1000.0);
            out.put("customData", mediaStatus.getCustomData());
            //out.put("extendedStatus",);
            out.put("idleReason", ChromecastUtilities.getMediaIdleReason(mediaStatus));
            //out.put("items", mediaStatus.getQueueItems());
            //out.put("liveSeekableRange",);
            out.put("loadingItemId", mediaStatus.getLoadingItemId());
            out.put("media", createMediaInfoObject(session));
            out.put("mediaSessionId", 1);
            out.put("playbackRate", mediaStatus.getPlaybackRate());
            out.put("playerState", ChromecastUtilities.getMediaPlayerState(mediaStatus));
            out.put("preloadedItemId", mediaStatus.getPreloadedItemId());
            //out.put("queueData", );
            //out.put("repeatMode", mediaStatus.getQueueRepeatMode());
            out.put("sessionId", session.getSessionId());
            //out.put("supportedMediaCommands", );
            //out.put("videoInfo", );


            JSONObject volume = new JSONObject();
            volume.put("level", mediaStatus.getStreamVolume());
            volume.put("muted", mediaStatus.isMute());
            out.put("volume", volume);

            long[] activeTrackIds = mediaStatus.getActiveTrackIds();
            if (activeTrackIds != null) {
                JSONArray activeTracks = new JSONArray();
                for (long activeTrackId : activeTrackIds) {
                    activeTracks.put(activeTrackId);
                }
                out.put("activeTrackIds", activeTracks);
            }

        } catch (JSONException e) {

        } catch (NullPointerException e) {

        }

        return out;
    }

    private static JSONArray createMediaInfoTracks(CastSession session) {
        JSONArray out = new JSONArray();

        try {
            MediaStatus mediaStatus = session.getRemoteMediaClient().getMediaStatus();
            MediaInfo mediaInfo = mediaStatus.getMediaInfo();

            if (mediaInfo.getMediaTracks() == null) {
                return out;
            }

            for (MediaTrack track : mediaInfo.getMediaTracks()) {
                JSONObject jsonTrack = new JSONObject();


                // TODO: Missing attributes are commented out.
                //  These are returned by the chromecast desktop SDK, we should probbaly return them too

                jsonTrack.put("trackId", track.getId());
                jsonTrack.put("customData", track.getCustomData());
                jsonTrack.put("language", track.getLanguage());
                jsonTrack.put("name", track.getName());
                jsonTrack.put("subtype", ChromecastUtilities.getTrackSubtype(track));
                jsonTrack.put("trackContentId", track.getContentId());
                jsonTrack.put("trackContentType", track.getContentType());
                jsonTrack.put("type", ChromecastUtilities.getTrackType(track));

                out.put(jsonTrack);
            }
        } catch (JSONException e) {

        } catch (NullPointerException e) {

        }

        return out;
    }

    private static JSONObject createMediaInfoObject(CastSession session) {
        JSONObject out = new JSONObject();

        try {
            MediaStatus mediaStatus = session.getRemoteMediaClient().getMediaStatus();
            MediaInfo mediaInfo = mediaStatus.getMediaInfo();

            // TODO: Missing attributes are commented out.
            //  These are returned by the chromecast desktop SDK, we should probbaly return them too
            //out.put("breakClips",);
            //out.put("breaks",);
            out.put("contentId", mediaInfo.getContentId());
            out.put("contentType", mediaInfo.getContentType());
            out.put("customData", mediaInfo.getCustomData());
            //out.put("idleReason",);
            //out.put("items",);
            out.put("duration", mediaInfo.getStreamDuration() / 1000.0);
            //out.put("mediaCategory",);
            out.put("streamType", ChromecastUtilities.getMediaInfoStreamType(mediaInfo));
            out.put("tracks", createMediaInfoTracks(session));
            out.put("textTrackStyle", ChromecastUtilities.createTextTrackObject(mediaInfo.getTextTrackStyle()));

            // TODO: Check if it's useful
            //out.put("metadata", mediaInfo.getMetadata());
        } catch (JSONException e) {

        } catch (NullPointerException e) {

        }

        return out;
    }

    static JSONObject createTextTrackObject(TextTrackStyle textTrackStyle) {
        JSONObject out = new JSONObject();
        try {
            out.put("backgroundColor", getHexColor(textTrackStyle.getBackgroundColor()));
            out.put("customData", textTrackStyle.getCustomData());
            out.put("edgeColor", getHexColor(textTrackStyle.getEdgeColor()));
            out.put("edgeType", getEdgeType(textTrackStyle));
            out.put("fontFamily", textTrackStyle.getFontFamily());
            out.put("fontGenericFamily", getFontGenericFamily(textTrackStyle));
            out.put("fontScale", textTrackStyle.getFontScale());
            out.put("fontStyle", getFontStyle(textTrackStyle));
            out.put("foregroundColor", getHexColor(textTrackStyle.getForegroundColor()));
            out.put("windowColor", getHexColor(textTrackStyle.getWindowColor()));
            out.put("windowRoundedCornerRadius", textTrackStyle.getWindowCornerRadius());
            out.put("windowType", getWindowType(textTrackStyle));
        } catch (JSONException e) {

        }

        return out;
    }

    /**
     * Simple helper to convert a route to JSON for passing down to the javascript side.
     * @param routes the routes to convert
     * @return a JSON Array of JSON representations of the routes
     */
    static JSONArray createRoutesArray(List<MediaRouter.RouteInfo> routes) {
        JSONArray routesArray = new JSONArray();
        for (MediaRouter.RouteInfo route : routes) {
            try {
                JSONObject obj = new JSONObject();
                obj.put("name", route.getName());
                obj.put("id", route.getId());

                CastDevice device = CastDevice.getFromBundle(route.getExtras());
                if (device != null) {
                    obj.put("isNearbyDevice", !device.isOnLocalNetwork());
                    obj.put("isCastGroup", route instanceof MediaRouter.RouteGroup);
                }

                routesArray.put(obj);
            } catch (JSONException e) {
            }
        }
        return routesArray;
    }

    static JSONObject createError(String code, String message) {
        JSONObject out = new JSONObject();
        try {
            out.put("code", code);
            out.put("description", message);
        } catch (JSONException e) {

        }
        return out;
    }
}
