package acidhax.cordova.chromecast;

import java.io.IOException;
import java.util.List;

import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.google.android.gms.cast.Cast;
import com.google.android.gms.cast.CastDevice;
import com.google.android.gms.cast.MediaInfo;
import com.google.android.gms.cast.MediaLoadRequestData;
import com.google.android.gms.cast.MediaMetadata;
import com.google.android.gms.cast.MediaSeekOptions;
import com.google.android.gms.cast.MediaStatus;
import com.google.android.gms.cast.MediaTrack;
import com.google.android.gms.cast.TextTrackStyle;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;
import com.google.android.gms.cast.framework.media.RemoteMediaClient.MediaChannelResult;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.common.api.Status;
import com.google.android.gms.common.images.WebImage;

import android.app.Activity;
import android.net.Uri;
import androidx.annotation.NonNull;

/*
 * All of the Chromecast session specific functions should start here.
 */
public class ChromecastSession {

    /** The current context. */
    private Activity activity;
    /** A registered callback that we will un-register and re-register each time the session changes. */
    private RemoteMediaClient.Callback remoteMediaCallback;
    /** The current session. */
    private CastSession session;
    /** The current session's client for controlling playback. */
    private RemoteMediaClient client;

    /**
     * ChromecastSession constructor.
     * @param act the current activity
     * @param callback the callback will be used notify about session end
     */
    public ChromecastSession(Activity act, RemoteMediaClient.Callback callback) {
        this.activity = act;
        this.remoteMediaCallback = callback;
    }

    /**
     * Sets the session object the will be used for other commands in this class.
     * @param castSession the session to use
     */
    public void setSession(CastSession castSession) {
        activity.runOnUiThread(new Runnable() {
            public void run() {
                if (client != null) {
                    client.unregisterCallback(remoteMediaCallback);
                }
                session = castSession;
                if (session == null) {
                    client = null;
                } else {
                    client = session.getRemoteMediaClient();
                    client.registerCallback(remoteMediaCallback);
                }
            }
        });
    }


    /**
     * Adds a message listener if one does not already exist.
     * @param namespace namespace
     */
    public void addMessageListener(String namespace) {
        if (client == null || session == null) {
            return;
        }
        activity.runOnUiThread(new Runnable() {
            public void run() {
                try {
                    session.setMessageReceivedCallbacks(namespace, new Cast.MessageReceivedCallback() {
                        @Override
                        public void onMessageReceived(CastDevice castDevice, String s, String s1) {
        //                    if (this.onSessionUpdatedListener != null) {
        //                        this.onSessionUpdatedListener.onMessage(this, namespace, message);
        //                    }
                        }
                    });
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        });
    }

    /**
     * Sends a message to a specified namespace.
     * @param namespace namespace
     * @param message the message to send
     * @param callback called with success or error
     */
    public void sendMessage(String namespace, String message, CallbackContext callback) {
        if (client == null || session == null) {
            callback.error("SESSION_ERROR");
            return;
        }
        activity.runOnUiThread(new Runnable() {
            public void run() {
                session.sendMessage(namespace, message).setResultCallback(new ResultCallback<Status>() {
                    @Override
                    public void onResult(Status result) {
                        if (!result.isSuccess()) {
                            callback.success();
                        } else {
                            callback.error(result.toString());
                        }
                    }
                });

            }
        });
    }

    /**
     * Loads media over the media API.
     * @param contentId      - The URL of the content
     * @param customData     - CustomData
     * @param contentType    - The MIME type of the content
     * @param duration       - The length of the video (if known)
     * @param streamType     - The stream type
     * @param autoPlay       - Whether or not to start the video playing or not
     * @param currentTime    - Where in the video to begin playing from
     * @param metadata       - Metadata
     * @param textTrackStyle - The text track style
     * @param callback called with success or error
     */
    public void loadMedia(String contentId, JSONObject customData, String contentType, long duration, String streamType, boolean autoPlay, double currentTime, JSONObject metadata, JSONObject textTrackStyle, CallbackContext callback) {
        if (client == null || session == null) {
            callback.error("SESSION_ERROR");
            return;
        }
        activity.runOnUiThread(new Runnable() {
            public void run() {
                MediaInfo mediaInfo = createMediaInfo(contentId, customData, contentType, duration, streamType, metadata, textTrackStyle);
                MediaLoadRequestData loadRequest = new MediaLoadRequestData.Builder()
                        .setMediaInfo(mediaInfo)
                        .setAutoplay(autoPlay)
                        .setCurrentTime((long) currentTime * 1000)
                        .build();

                client.load(loadRequest).setResultCallback(new ResultCallback<MediaChannelResult>() {
                    @Override
                    public void onResult(@NonNull MediaChannelResult result) {
                        if (result.getStatus().isSuccess()) {
                            callback.success(createMediaObject());
                        } else {
                            callback.error("SESSION_ERROR");
                        }
                    }
                });
            }
        });
    }

    private MediaInfo createMediaInfo(String contentId, JSONObject customData, String contentType, long duration, String streamType, JSONObject metadata, JSONObject textTrackStyle) {
        // create GENERIC MediaMetadata first and fallback to movie
        MediaMetadata mediaMetadata = new MediaMetadata();
        try {
            int metadataType = metadata.has("metadataType") ? metadata.getInt("metadataType") : MediaMetadata.MEDIA_TYPE_MOVIE;
            if (metadataType == MediaMetadata.MEDIA_TYPE_GENERIC) {
                mediaMetadata.putString(MediaMetadata.KEY_TITLE, (metadata.has("title")) ? metadata.getString("title") : "[Title not set]"); // TODO: What should it default to?
                mediaMetadata.putString(MediaMetadata.KEY_SUBTITLE, (metadata.has("title")) ? metadata.getString("subtitle") : "[Subtitle not set]"); // TODO: What should it default to?
                mediaMetadata = addImages(metadata, mediaMetadata);
            }
        } catch (Exception e) {
            e.printStackTrace();
            mediaMetadata = new MediaMetadata(MediaMetadata.MEDIA_TYPE_MOVIE);
        }

        int intStreamType;
        switch (streamType) {
            case "buffered":
                intStreamType = MediaInfo.STREAM_TYPE_BUFFERED;
                break;
            case "live":
                intStreamType = MediaInfo.STREAM_TYPE_LIVE;
                break;
            default:
                intStreamType = MediaInfo.STREAM_TYPE_NONE;
        }

        TextTrackStyle trackStyle = ChromecastUtilities.parseTextTrackStyle(textTrackStyle);
        MediaInfo mediaInfo = new MediaInfo.Builder(contentId)
                .setContentType(contentType)
                .setCustomData(customData)
                .setStreamType(intStreamType)
                .setStreamDuration(duration)
                .setMetadata(mediaMetadata)
                .setTextTrackStyle(trackStyle)
                .build();

        return mediaInfo;
    }

    private MediaMetadata addImages(JSONObject metadata, MediaMetadata mediaMetadata) throws JSONException {
        if (metadata.has("images")) {
            JSONArray imageUrls = metadata.getJSONArray("images");
            for (int i = 0; i < imageUrls.length(); i++) {
                JSONObject imageObj = imageUrls.getJSONObject(i);
                String imageUrl = imageObj.has("url") ? imageObj.getString("url") : "undefined";
                if (!imageUrl.contains("http://")) {
                    continue;
                }
                Uri imageURI = Uri.parse(imageUrl);
                WebImage webImage = new WebImage(imageURI);
                mediaMetadata.addImage(webImage);
            }
        }
        return mediaMetadata;
    }

    /**
     * Media API - Calls play on the current media.
     * @param callback called with success or error
     */
    public void mediaPlay(CallbackContext callback) {
        if (client == null || session == null) {
            callback.error("SESSION_ERROR");
            return;
        }
        activity.runOnUiThread(new Runnable() {
            public void run() {
                client.play().setResultCallback(new ResultCallback<MediaChannelResult>() {
                    @Override
                    public void onResult(@NonNull MediaChannelResult result) {
                        if (result.getStatus().isSuccess()) {
                            callback.success();
                        } else {
                            callback.error("Failed to play with code: " + result.getStatus().getStatusCode());
                        }
                    }
                });
            }
        });
    }

    /**
     * Media API - Calls pause on the current media.
     * @param callback called with success or error
     */
    public void mediaPause(CallbackContext callback) {
        if (client == null || session == null) {
            callback.error("SESSION_ERROR");
            return;
        }
        activity.runOnUiThread(new Runnable() {
            public void run() {
                client.pause().setResultCallback(new ResultCallback<MediaChannelResult>() {
                    @Override
                    public void onResult(@NonNull MediaChannelResult result) {
                        if (result.getStatus().isSuccess()) {
                            callback.success();
                        } else {
                            callback.error("Failed to pause with code: " + result.getStatus().getStatusCode());
                        }
                    }
                });
            }
        });
    }

    /**
     * Media API - Seeks the current playing media.
     * @param seekPosition - Seconds to seek to
     * @param resumeState  - Resume state once seeking is complete: PLAYBACK_PAUSE or PLAYBACK_START
     * @param callback called with success or error
     */
    public void mediaSeek(long seekPosition, String resumeState, CallbackContext callback) {
        if (client == null || session == null) {
            callback.error("SESSION_ERROR");
            return;
        }
        activity.runOnUiThread(new Runnable() {
            public void run() {
                int resState;
                switch (resumeState) {
                    case "PLAYBACK_START":
                        resState = MediaSeekOptions.RESUME_STATE_PLAY;
                        break;
                    case "PLAYBACK_PAUSE":
                        resState = MediaSeekOptions.RESUME_STATE_PAUSE;
                        break;
                    default:
                        resState = MediaSeekOptions.RESUME_STATE_UNCHANGED;
                }

                client.seek(new MediaSeekOptions.Builder()
                        .setPosition(seekPosition)
                        .setResumeState(resState)
                        .build()
                ).setResultCallback(new ResultCallback<MediaChannelResult>() {
                    @Override
                    public void onResult(@NonNull MediaChannelResult result) {
                        if (result.getStatus().isSuccess()) {
                            callback.success();
                        } else {
                            callback.error("Failed to seek with code: " + result.getStatus().getStatusCode());
                        }
                    }
                });
            }
        });
    }

    /**
     * Media API - Sets the volume on the current playing media object, NOT ON THE CHROMECAST DIRECTLY.
     * @param level the level to set the volume to
     * @param callback called with success or error
     */
    public void mediaSetVolume(double level, CallbackContext callback) {
        if (client == null || session == null) {
            callback.error("SESSION_ERROR");
            return;
        }
        activity.runOnUiThread(new Runnable() {
            public void run() {
                client.play().setResultCallback(new ResultCallback<MediaChannelResult>() {
                    @Override
                    public void onResult(@NonNull MediaChannelResult result) {
                        if (result.getStatus().isSuccess()) {
                            callback.success();
                        } else {
                            callback.error("Failed to set volume with code: " + result.getStatus().getStatusCode());
                        }
                    }
                });
            }
        });
    }

    /**
     * Media API - Sets the muted state on the current playing media, NOT THE CHROMECAST DIRECTLY.
     * @param muted if true set the media to muted, else, unmute
     * @param callback called with success or error
     */
    public void mediaSetMuted(boolean muted, CallbackContext callback) {
        if (client == null || session == null) {
            callback.error("SESSION_ERROR");
            return;
        }
        activity.runOnUiThread(new Runnable() {
            public void run() {
                client.setStreamMute(muted).setResultCallback(new ResultCallback<MediaChannelResult>() {
                    @Override
                    public void onResult(@NonNull MediaChannelResult result) {
                        if (result.getStatus().isSuccess()) {
                            callback.success();
                        } else {
                            callback.error("Failed to mute/unmute with code: " + result.getStatus().getStatusCode());
                        }
                    }
                });
            }
        });
    }

    /**
     * Media API - Stops and unloads the current playing media.
     * @param callback called with success or error
     */
    public void mediaStop(CallbackContext callback) {
        if (client == null || session == null) {
            callback.error("SESSION_ERROR");
            return;
        }
        activity.runOnUiThread(new Runnable() {
            public void run() {
                client.stop().setResultCallback(new ResultCallback<MediaChannelResult>() {
                    @Override
                    public void onResult(@NonNull MediaChannelResult result) {
                        if (result.getStatus().isSuccess()) {
                            callback.success();
                        } else {
                            callback.error("Failed to stop with code: " + result.getStatus().getStatusCode());
                        }
                    }
                });
            }
        });
    }

    /**
     * Handle track changed.
     * @param activeTracksIds active track ids
     * @param textTrackStyle track style
     * @param callback called with success or error
     */
    public void mediaEditTracksInfo(long[] activeTracksIds, JSONObject textTrackStyle, CallbackContext callback) {
        if (client == null || session == null) {
            callback.error("SESSION_ERROR");
            return;
        }
        activity.runOnUiThread(new Runnable() {
            public void run() {
                client.setActiveMediaTracks(activeTracksIds).setResultCallback(new ResultCallback<MediaChannelResult>() {
                    @Override
                    public void onResult(@NonNull MediaChannelResult result) {
                        if (result.getStatus().isSuccess()) {
                            callback.success();
                        } else {
                            callback.error("Failed to set active media tracks with code: " + result.getStatus().getStatusCode());
                        }
                    }
                });
                client.setTextTrackStyle(ChromecastUtilities.parseTextTrackStyle(textTrackStyle)).setResultCallback(new ResultCallback<MediaChannelResult>() {
                    @Override
                    public void onResult(@NonNull MediaChannelResult result) {
                        if (result.getStatus().isSuccess()) {
                            callback.success();
                        } else {
                            callback.error("Failed to set text track style with code: " + result.getStatus().getStatusCode());
                        }
                    }
                });
            }
        });
    }

    /**
     * Sets the receiver volume level.
     * @param volume volume to set the receiver to
     * @param callback called with success or error
     */
    public void setVolume(double volume, CallbackContext callback) {
        if (client == null || session == null) {
            callback.error("SESSION_ERROR");
            return;
        }
        activity.runOnUiThread(new Runnable() {
            public void run() {
                try {
                    session.setVolume(volume);
                    callback.success();
                } catch (IOException e) {
                    callback.error("CHANNEL_ERROR");
                }
            }
        });
    }

    /**
     * Mutes the receiver.
     * @param muted if true mute, else, unmute
     * @param callback called with success or error
     */
    public void setMute(boolean muted, CallbackContext callback) {
        if (client == null || session == null) {
            callback.error("SESSION_ERROR");
            return;
        }
        activity.runOnUiThread(new Runnable() {
            public void run() {
                try {
                    session.setMute(muted);
                    callback.success();
                } catch (IOException e) {
                    callback.error("CHANNEL_ERROR");
                }
            }
        });
    }

    /**
     * Creates a JSON representation of this session.
     * @return a JSON representation of this session
     */
    public JSONObject createSessionObject() {
        JSONObject out = new JSONObject();

        try {
            out.put("appId", session.getApplicationMetadata().getApplicationId());
            out.put("appImages", createAppImagesObject());
            out.put("displayName", session.getApplicationMetadata().getName());
            out.put("media", createMediaObject());
            out.put("receiver", createReceiverObject());
            out.put("sessionId", this.session.getSessionId());

        } catch (JSONException e) {
            e.printStackTrace();
        } catch (NullPointerException e) {
            e.printStackTrace();
        }

        return out;
    }

    private JSONArray createAppImagesObject() {
        JSONArray appImages = new JSONArray();
        try {
            MediaMetadata metadata = client.getMediaInfo().getMetadata();
            List<WebImage> images = metadata.getImages();
            if (images != null) {
                for (WebImage o : images) {
                    appImages.put(o.toString());
                }
            }
        } catch (NullPointerException e) {
            e.printStackTrace();
        }
        return appImages;
    }

    private JSONObject createReceiverObject() {
        JSONObject out = new JSONObject();
        try {
            out.put("friendlyName", this.session.getCastDevice().getFriendlyName());
            out.put("label", this.session.getCastDevice().getDeviceId());

            JSONObject volume = new JSONObject();
            try {
                volume.put("level", session.getVolume());
                volume.put("muted", session.isMute());
            } catch (JSONException e) {
                e.printStackTrace();
            }
            out.put("volume", volume);

        } catch (JSONException e) {
            e.printStackTrace();
        } catch (NullPointerException e) {
            e.printStackTrace();
        }
        return out;
    }

    /**
     * Creates a JSON representation of the current playing media.
     * @return a JSON representation of the current playing media
     */
    private JSONObject createMediaObject() {
        JSONObject out = new JSONObject();

        try {
            MediaStatus mediaStatus = client.getMediaStatus();


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
            out.put("media", this.createMediaInfoObject());
            out.put("mediaSessionId", 1);
            out.put("playbackRate", mediaStatus.getPlaybackRate());
            out.put("playerState", ChromecastUtilities.getMediaPlayerState(mediaStatus));
            out.put("preloadedItemId", mediaStatus.getPreloadedItemId());
            //out.put("queueData", );
            //out.put("repeatMode", mediaStatus.getQueueRepeatMode());
            out.put("sessionId", this.session.getSessionId());
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
            e.printStackTrace();
        } catch (NullPointerException e) {
            e.printStackTrace();
        }

        return out;
    }

    /**
     * Creates a JSON representation of all Tracks available in the current media.
     * @return a JSON representation of all Tracks available in the current media
     */
    private JSONArray createMediaInfoTracks() {
        JSONArray out = new JSONArray();

        try {
            MediaStatus mediaStatus = client.getMediaStatus();
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
            e.printStackTrace();
        }

        return out;
    }


    /**
     * Creates a JSON representation of current MediaInfo of the session.
     * @return a JSON representation of current MediaInfo of the session
     */
    private JSONObject createMediaInfoObject() {
        JSONObject out = new JSONObject();

        try {
            MediaStatus mediaStatus = client.getMediaStatus();
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
            out.put("tracks", this.createMediaInfoTracks());
            out.put("textTrackStyle", ChromecastUtilities.createTextTrackObject(mediaInfo.getTextTrackStyle()));

            // TODO: Check if it's useful
            //out.put("metadata", mediaInfo.getMetadata());
        } catch (JSONException e) {
            e.printStackTrace();
        }

        return out;
    }

}
