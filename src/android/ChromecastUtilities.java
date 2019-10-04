package acidhax.cordova.chromecast;

import android.graphics.Color;

import androidx.mediarouter.media.MediaRouter;

import com.google.android.gms.cast.ApplicationMetadata;
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
import java.util.Set;

final class ChromecastUtilities {

    private ChromecastUtilities() {
        //not called
    }

    static String getMediaIdleReason(MediaStatus mediaStatus) {
        switch (mediaStatus.getIdleReason()) {
            case MediaStatus.IDLE_REASON_CANCELED:
                return "CANCELLED";
            case MediaStatus.IDLE_REASON_ERROR:
                return "ERROR";
            case MediaStatus.IDLE_REASON_FINISHED:
                return "FINISHED";
            case MediaStatus.IDLE_REASON_INTERRUPTED:
                return "INTERRUPTED";
            case MediaStatus.IDLE_REASON_NONE:
            default:
                return null;
        }
    }

    static String getMediaPlayerState(MediaStatus mediaStatus) {
        switch (mediaStatus.getPlayerState()) {
            case MediaStatus.PLAYER_STATE_LOADING:
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

    static String getRepeatMode(MediaStatus mediaStatus) {
        switch (mediaStatus.getQueueRepeatMode()) {
            case MediaStatus.REPEAT_MODE_REPEAT_OFF:
                return "REPEAT_OFF";
            case MediaStatus.REPEAT_MODE_REPEAT_ALL:
                return "REPEAT_ALL";
            case MediaStatus.REPEAT_MODE_REPEAT_SINGLE:
                return "REPEAT_SINGLE";
            case MediaStatus.REPEAT_MODE_REPEAT_ALL_AND_SHUFFLE:
                return "REPEAT_ALL_AND_SHUFFLE";
            default:
                return null;
        }
    }

    static String getAndroidMetadataName(String clientName) {
        switch (clientName) {
            case "albumArtist":
                return MediaMetadata.KEY_ALBUM_ARTIST;
            case "albumTitle":
                return MediaMetadata.KEY_ALBUM_TITLE;
            case "artist":
                return MediaMetadata.KEY_ARTIST;
            case "bookTitle":
                return MediaMetadata.KEY_BOOK_TITLE;
            case "broadcastDate":
                return MediaMetadata.KEY_BROADCAST_DATE;
            case "chapterNumber":
                return MediaMetadata.KEY_CHAPTER_NUMBER;
            case "chapterTitle":
                return MediaMetadata.KEY_CHAPTER_TITLE;
            case "composer":
                return MediaMetadata.KEY_COMPOSER;
            case "creationDate":
                return MediaMetadata.KEY_CREATION_DATE;
            case "discNumber":
                return MediaMetadata.KEY_DISC_NUMBER;
            case "episodeNumber":
                return MediaMetadata.KEY_EPISODE_NUMBER;
            case "height":
                return MediaMetadata.KEY_HEIGHT;
            case "locationLatitude":
                return MediaMetadata.KEY_LOCATION_LATITUDE;
            case "locationLongitude":
                return MediaMetadata.KEY_LOCATION_LONGITUDE;
            case "locationName":
                return MediaMetadata.KEY_LOCATION_NAME;
            case "queueItemId":
                return MediaMetadata.KEY_QUEUE_ITEM_ID;
            case "releaseDate":
                return MediaMetadata.KEY_RELEASE_DATE;
            case "seasonNumber":
                return MediaMetadata.KEY_SEASON_NUMBER;
            case "sectionDuration":
                return MediaMetadata.KEY_SECTION_DURATION;
            case "sectionStartAbsoluteTime":
                return MediaMetadata.KEY_SECTION_START_ABSOLUTE_TIME;
            case "sectionStartTimeInContainer":
                return MediaMetadata.KEY_SECTION_START_TIME_IN_CONTAINER;
            case "sectionStartTimeInMedia":
                return MediaMetadata.KEY_SECTION_START_TIME_IN_MEDIA;
            case "seriesTitle":
                return MediaMetadata.KEY_SERIES_TITLE;
            case "studio":
                return MediaMetadata.KEY_STUDIO;
            case "subtitle":
                return MediaMetadata.KEY_SUBTITLE;
            case "title":
                return MediaMetadata.KEY_TITLE;
            case "trackNumber":
                return MediaMetadata.KEY_TRACK_NUMBER;
            case "width":
                return MediaMetadata.KEY_WIDTH;
            default:
                return clientName;
        }
    }

    static String getClientMetadataName(String androidName) {
        switch (androidName) {
            case MediaMetadata.KEY_ALBUM_ARTIST:
                return "albumArtist";
            case MediaMetadata.KEY_ALBUM_TITLE:
                return "albumTitle";
            case MediaMetadata.KEY_ARTIST:
                return "artist";
            case MediaMetadata.KEY_BOOK_TITLE:
                return "bookTitle";
            case MediaMetadata.KEY_BROADCAST_DATE:
                return "broadcastDate";
            case MediaMetadata.KEY_CHAPTER_NUMBER:
                return "chapterNumber";
            case MediaMetadata.KEY_CHAPTER_TITLE:
                return "chapterTitle";
            case MediaMetadata.KEY_COMPOSER:
                return "composer";
            case MediaMetadata.KEY_CREATION_DATE:
                return "creationDate";
            case MediaMetadata.KEY_DISC_NUMBER:
                return "discNumber";
            case MediaMetadata.KEY_EPISODE_NUMBER:
                return "episodeNumber";
            case MediaMetadata.KEY_HEIGHT:
                return "height";
            case MediaMetadata.KEY_LOCATION_LATITUDE:
                return "locationLatitude";
            case MediaMetadata.KEY_LOCATION_LONGITUDE:
                return "locationLongitude";
            case MediaMetadata.KEY_LOCATION_NAME:
                return "locationName";
            case MediaMetadata.KEY_QUEUE_ITEM_ID:
                return "queueItemId";
            case MediaMetadata.KEY_RELEASE_DATE:
                return "releaseDate";
            case MediaMetadata.KEY_SEASON_NUMBER:
                return "seasonNumber";
            case MediaMetadata.KEY_SECTION_DURATION:
                return "sectionDuration";
            case MediaMetadata.KEY_SECTION_START_ABSOLUTE_TIME:
                return "sectionStartAbsoluteTime";
            case MediaMetadata.KEY_SECTION_START_TIME_IN_CONTAINER:
                return "sectionStartTimeInContainer";
            case MediaMetadata.KEY_SECTION_START_TIME_IN_MEDIA:
                return "sectionStartTimeInMedia";
            case MediaMetadata.KEY_SERIES_TITLE:
                return "seriesTitle";
            case MediaMetadata.KEY_STUDIO:
                return "studio";
            case MediaMetadata.KEY_SUBTITLE:
                return "subtitle";
            case MediaMetadata.KEY_TITLE:
                return "title";
            case MediaMetadata.KEY_TRACK_NUMBER:
                return "trackNumber";
            case MediaMetadata.KEY_WIDTH:
                return "width";
            default:
                return androidName;
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
            ApplicationMetadata metadata = session.getApplicationMetadata();
            out.put("appId", metadata.getApplicationId());
            try {
                out.put("appImages", createImagesArray(metadata.getImages()));
            } catch (NullPointerException e) {
            }
            out.put("displayName", metadata.getName());
            out.put("media", createMediaArray(session));
            out.put("receiver", createReceiverObject(session));
            out.put("sessionId", session.getSessionId());

        } catch (JSONException e) {
        } catch (NullPointerException e) {
        } catch (IllegalStateException e) {
        }

        return out;
    }

    private static JSONArray createImagesArray(List<WebImage> images) throws JSONException {
        JSONArray appImages = new JSONArray();
        JSONObject img;
        for (WebImage o : images) {
            img = new JSONObject();
            img.put("url", o.getUrl().toString());
            appImages.put(img);
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

    static JSONArray createMediaArray(CastSession session) {
        JSONArray out = new JSONArray();
        JSONObject mediaInfoObj = createMediaObject(session);
        if (mediaInfoObj != null) {
            out.put(mediaInfoObj);
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
            String idleReason = ChromecastUtilities.getMediaIdleReason(mediaStatus);
            if (idleReason != null) {
                out.put("idleReason", idleReason);
            }
            //out.put("items", mediaStatus.getQueueItems());
            //out.put("liveSeekableRange",);
            out.put("loadingItemId", mediaStatus.getLoadingItemId());
            out.put("media", createMediaInfoObject(session));
            out.put("mediaSessionId", 1);
            out.put("playbackRate", mediaStatus.getPlaybackRate());
            out.put("playerState", ChromecastUtilities.getMediaPlayerState(mediaStatus));
            out.put("preloadedItemId", mediaStatus.getPreloadedItemId());
            //out.put("queueData", );
            out.put("repeatMode", getRepeatMode(mediaStatus));
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
            return null;
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
            MediaInfo mediaInfo = session.getRemoteMediaClient().getMediaInfo();

            // TODO: Missing attributes are commented out.
            //  These are returned by the chromecast desktop SDK, we should probably return them too
            //out.put("breakClips",);
            //out.put("breaks",);
            out.put("contentId", mediaInfo.getContentId());
            out.put("contentType", mediaInfo.getContentType());
            out.put("customData", mediaInfo.getCustomData());
            out.put("duration", mediaInfo.getStreamDuration() / 1000.0);
            //out.put("mediaCategory",);
            out.put("metadata", createMetadataObject(mediaInfo.getMetadata()));
            out.put("streamType", ChromecastUtilities.getMediaInfoStreamType(mediaInfo));
            out.put("tracks", createMediaInfoTracks(session));
            out.put("textTrackStyle", ChromecastUtilities.createTextTrackObject(mediaInfo.getTextTrackStyle()));

        } catch (JSONException e) {
        } catch (NullPointerException e) {
        }

        return out;
    }

    static JSONObject createMetadataObject(MediaMetadata metadata) {
        JSONObject out = new JSONObject();
        try {
            try {
                out.put("images", createImagesArray(metadata.getImages()));
            } catch (Exception e) {
            }
            out.put("metadataType", metadata.getMediaType());
            Set<String> keys = metadata.keySet();
            String outKey;
            for (String key : keys) {
                outKey = ChromecastUtilities.getClientMetadataName(key);
                if (outKey.equals("type")) {
                    continue;
                }
                out.put(outKey, metadata.getString(key));
            }
            out.put("type", metadata.getMediaType());
        } catch (Exception e) {
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
