package acidhax.cordova.chromecast;

import android.graphics.Color;
import android.support.v4.content.ContextCompat;

import com.google.android.gms.cast.MediaInfo;
import com.google.android.gms.cast.MediaStatus;
import com.google.android.gms.cast.MediaTrack;
import com.google.android.gms.cast.TextTrackStyle;

import org.json.JSONException;
import org.json.JSONObject;
import org.w3c.dom.Text;

class ChromecastUtilities {

    static String getMediaIdleReason(MediaStatus mediaStatus) {
        switch(mediaStatus.getIdleReason()) {
            case MediaStatus.IDLE_REASON_CANCELED:
                return "canceled";
            case MediaStatus.IDLE_REASON_ERROR:
                return "error";
            case MediaStatus.IDLE_REASON_FINISHED:
                return "finished";
            case MediaStatus.IDLE_REASON_INTERRUPTED:
                return "interrupted";
            case MediaStatus.IDLE_REASON_NONE:
                return "none";
            default:
                return null;
        }
    }

    static String getMediaPlayerState(MediaStatus mediaStatus) {
        switch(mediaStatus.getPlayerState()) {
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
        switch(mediaInfo.getStreamType()) {
            case MediaInfo.STREAM_TYPE_BUFFERED:
                return "buffered";
            case MediaInfo.STREAM_TYPE_LIVE:
                return "live";
            case MediaInfo.STREAM_TYPE_NONE:
                return "other";
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
            e.printStackTrace();
        }

        return out;
    }

}
