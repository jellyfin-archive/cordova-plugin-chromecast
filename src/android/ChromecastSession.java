package acidhax.cordova.chromecast;

import java.io.IOException;
import java.util.List;

import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.google.android.gms.cast.ApplicationMetadata;
import com.google.android.gms.cast.Cast;
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
public class ChromecastSession extends ChromecastConnection.Listener {

    /** The current context. */
    private Activity activity;
    /** A registered callback that we will un-register and re-register each time the session changes. */
    private Listener clientListener;
    /** The current session. */
    private CastSession session;
    /** The current session's client for controlling playback. */
    private RemoteMediaClient client;

    /**
     * ChromecastSession constructor.
     * @param act the current activity
     * @param listener callback that will notify of certain events
     */
    public ChromecastSession(Activity act, @NonNull Listener listener) {
        this.activity = act;
        this.clientListener = listener;
    }

    /**
     * Sets the session object the will be used for other commands in this class.
     * @param castSession the session to use
     */
    public void setSession(CastSession castSession) {
        activity.runOnUiThread(new Runnable() {
            public void run() {
                if (castSession == null) {
                    client = null;
                    return;
                }
                if (castSession.equals(session)) {
                    // Don't client and listeners if session did not change
                    return;
                }
                session = castSession;
                client = session.getRemoteMediaClient();
                if (client == null) {
                    return;
                }
                client.registerCallback(new RemoteMediaClient.Callback() {
                    private String currentMedia = "";
                    @Override
                    public void onStatusUpdated() {
                        super.onStatusUpdated();
                        clientListener.onMediaUpdate(createMediaObject());
                    }
                    @Override
                    public void onMetadataUpdated() {
                        super.onMetadataUpdated();
                        MediaInfo info = client.getMediaInfo();
                        if (info == null) {
                            currentMedia = "";
                        } else {
                            String newMedia = info.getContentId();
                            if (!currentMedia.equals(newMedia)) {
                                currentMedia = newMedia;
                                clientListener.onMediaLoaded(createMediaObject());
                            }
                        }
                        clientListener.onMediaUpdate(createMediaObject());
                    }
                    @Override
                    public void onQueueStatusUpdated() {
                        super.onQueueStatusUpdated();
                        clientListener.onMediaUpdate(createMediaObject());
                    }
                    @Override
                    public void onPreloadStatusUpdated() {
                        super.onPreloadStatusUpdated();
                        clientListener.onMediaUpdate(createMediaObject());
                    }
                    @Override
                    public void onSendingRemoteMediaRequest() {
                        super.onSendingRemoteMediaRequest();
                        clientListener.onMediaUpdate(createMediaObject());
                    }
                    @Override
                    public void onAdBreakStatusUpdated() {
                        super.onAdBreakStatusUpdated();
                        clientListener.onMediaUpdate(createMediaObject());
                    }
                });
                session.addCastListener(new Cast.Listener() {
                    @Override
                    public void onApplicationStatusChanged() {
                        super.onApplicationStatusChanged();
                        clientListener.onSessionUpdate(createSessionObject());
                    }
                    @Override
                    public void onApplicationMetadataChanged(ApplicationMetadata applicationMetadata) {
                        super.onApplicationMetadataChanged(applicationMetadata);
                        clientListener.onSessionUpdate(createSessionObject());
                    }
                    @Override
                    public void onApplicationDisconnected(int i) {
                        super.onApplicationDisconnected(i);
                        onSessionEnd(session, "stopped");
                    }
                    @Override
                    public void onActiveInputStateChanged(int i) {
                        super.onActiveInputStateChanged(i);
                        clientListener.onSessionUpdate(createSessionObject());
                    }
                    @Override
                    public void onStandbyStateChanged(int i) {
                        super.onStandbyStateChanged(i);
                        clientListener.onSessionUpdate(createSessionObject());
                    }
                    @Override
                    public void onVolumeChanged() {
                        super.onVolumeChanged();
                        clientListener.onSessionUpdate(createSessionObject());
                    }
                });
            }
        });
    }

    /** ChromecastConnection.Listener implementations. */
    @Override
    void onInvalidateSession() {
        setSession(null);
    }
    @Override
    final void onSessionStarted(CastSession castSession) {
        setSession(castSession);
    }
    @Override
    final void onSessionRejoined(CastSession castSession) {
        setSession(castSession);
        clientListener.onSessionRejoined(createSessionObject());
    }
    @Override
    final void onSessionEnd(CastSession castSession, String state) {
        onInvalidateSession();
        JSONObject s = createSessionObject(castSession);
        if (state != null) {
            try {
                s.put("status", state);
            } catch (JSONException e) {

            }
        }
        clientListener.onSessionUpdate(s);
    }
    @Override
    void onReceiverAvailableUpdate(boolean available) {
        clientListener.onReceiverAvailableUpdate(available);
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
                    session.setMessageReceivedCallbacks(namespace, clientListener);
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
            callback.error("session_error");
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
            callback.error("session_error");
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
                            callback.error("session_error");
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
            callback.error("session_error");
            return;
        }
        activity.runOnUiThread(new Runnable() {
            public void run() {
                client.play()
                        .setResultCallback(getResultCallback(callback, "Failed to play."));
            }
        });
    }

    /**
     * Media API - Calls pause on the current media.
     * @param callback called with success or error
     */
    public void mediaPause(CallbackContext callback) {
        if (client == null || session == null) {
            callback.error("session_error");
            return;
        }
        activity.runOnUiThread(new Runnable() {
            public void run() {
                client.pause()
                        .setResultCallback(getResultCallback(callback, "Failed to pause."));
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
            callback.error("session_error");
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
                ).setResultCallback(getResultCallback(callback, "Failed to seek."));
            }
        });
    }

    /**
     * Media API - Sets the volume on the current playing media object, NOT ON THE CHROMECAST DIRECTLY.
     * @param level the level to set the volume to
     * @param muted if true set the media to muted, else, unmute
     * @param callback called with success or error
     */
    public void mediaSetVolume(Double level, Boolean muted, CallbackContext callback) {
        if (client == null || session == null) {
            callback.error("session_error");
            return;
        }
        activity.runOnUiThread(new Runnable() {
            public void run() {
                // Figure out the number of callbacks we expect to receive
                int calls = 0;
                if (level != null) {
                    calls++;
                }
                if (muted != null) {
                    calls++;
                }
                if (calls == 0) {
                    // No change
                    callback.success();
                    return;
                }

                // We need this callback so that we can wait for a variable number of calls to come back
                final int expectedCalls = calls;
                ResultCallback<MediaChannelResult> cb = new ResultCallback<MediaChannelResult>() {
                    private int callsCompleted = 0;
                    private String finalErr = null;
                    private void completionCall() {
                        callsCompleted++;
                        if (callsCompleted >= expectedCalls) {
                            // Both the setvolume an setMute have returned
                            if (finalErr != null) {
                                callback.error(finalErr);
                            } else {
                                callback.success();
                            }
                        }
                    }
                    @Override
                    public void onResult(@NonNull MediaChannelResult result) {
                        if (!result.getStatus().isSuccess()) {
                            if (finalErr == null) {
                                finalErr = "Failed to set media volume/mute state:\n";
                            }
                            JSONObject errorResult = result.getCustomData();
                            if (errorResult != null) {
                                finalErr += "\n" + errorResult;
                            }
                        }
                        completionCall();
                    }
                };

                if (level != null) {
                    client.setStreamVolume(level)
                            .setResultCallback(cb);
                }
                if (muted != null) {
                    client.setStreamMute(muted)
                            .setResultCallback(cb);
                }
            }
        });
    }

    /**
     * Media API - Stops and unloads the current playing media.
     * @param callback called with success or error
     */
    public void mediaStop(CallbackContext callback) {
        if (client == null || session == null) {
            callback.error("session_error");
            return;
        }
        activity.runOnUiThread(new Runnable() {
            public void run() {
                client.stop()
                        .setResultCallback(getResultCallback(callback, "Failed to stop."));
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
            callback.error("session_error");
            return;
        }
        activity.runOnUiThread(new Runnable() {
            public void run() {
                client.setActiveMediaTracks(activeTracksIds)
                        .setResultCallback(getResultCallback(callback, "Failed to set active media tracks."));
                client.setTextTrackStyle(ChromecastUtilities.parseTextTrackStyle(textTrackStyle))
                        .setResultCallback(getResultCallback(callback, "Failed to set text track style."));
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
            callback.error("session_error");
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
            callback.error("session_error");
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
     * Returns a resultCallback that wraps the callback and calls the onMediaUpdate listener.
     * @param callback client callback
     * @param errorMsg error message if failure
     * @return a callback for use in PendingResult.setResultCallback()
     */
    private ResultCallback<MediaChannelResult> getResultCallback(CallbackContext callback, String errorMsg) {
        return new ResultCallback<MediaChannelResult>() {
            @Override
            public void onResult(@NonNull MediaChannelResult result) {
                if (result.getStatus().isSuccess()) {
                    callback.success();
                } else {
                    JSONObject errorResult = result.getCustomData();
                    String error = errorMsg;
                    if (errorResult != null) {
                        error += "\nError details: " + errorMsg;
                    }
                    callback.error(error);
                }
            }
        };
    }

    private JSONObject createSessionObject() {
        return createSessionObject(session);
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
            e.printStackTrace();
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
            e.printStackTrace();
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

    private JSONObject createMediaObject() {
        return createMediaObject(session);
    }

    private static JSONObject createMediaObject(CastSession session) {
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
            e.printStackTrace();
        } catch (NullPointerException e) {
            e.printStackTrace();
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
            e.printStackTrace();
        } catch (NullPointerException e) {
            e.printStackTrace();
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
            e.printStackTrace();
        } catch (NullPointerException e) {
            e.printStackTrace();
        }

        return out;
    }

    interface Listener extends Cast.MessageReceivedCallback {
        void onMediaLoaded(JSONObject jsonMedia);
        void onMediaUpdate(JSONObject jsonMedia);
        void onSessionRejoined(JSONObject jsonSession);
        void onSessionUpdate(JSONObject jsonSession);
        void onReceiverAvailableUpdate(boolean available);
    }
}
