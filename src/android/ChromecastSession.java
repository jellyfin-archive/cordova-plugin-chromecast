package acidhax.cordova.chromecast;

import java.io.IOException;
import java.util.ArrayList;

import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.google.android.gms.cast.ApplicationMetadata;
import com.google.android.gms.cast.Cast;
import com.google.android.gms.cast.MediaInfo;
import com.google.android.gms.cast.MediaLoadRequestData;
import com.google.android.gms.cast.MediaQueueItem;
import com.google.android.gms.cast.MediaSeekOptions;
import com.google.android.gms.cast.MediaStatus;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.media.MediaQueue;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;
import com.google.android.gms.cast.framework.media.RemoteMediaClient.MediaChannelResult;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.common.api.Status;

import android.app.Activity;

import androidx.annotation.NonNull;

/*
 * All of the Chromecast session specific functions should start here.
 */
public class ChromecastSession {
    /** The current context. */
    private Activity activity;
    /** A registered callback that we will un-register and re-register each time the session changes. */
    private Listener clientListener;
    /** The current session. */
    private CastSession session;
    /** The current session's client for controlling playback. */
    private RemoteMediaClient client;
    /** Indicates whether we are requesting media or not. **/
    private boolean requestingMedia = false;
    /** Keeps track of the queueItems. **/
    private JSONArray queueItems;
    /** Stores a callback that should be called when the queue is loaded. **/
    private Runnable queueReloadCallback;
    /** Stores a callback that should be called when the queue status is updated. **/
    private Runnable queueStatusUpdatedCallback;

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
                    private int prevState = MediaStatus.PLAYER_STATE_IDLE;
                    private MediaInfo lastMedia;
                    @Override
                    public void onStatusUpdated() {
                        MediaStatus status = client.getMediaStatus();
                        if (status != null
                                && status.getPlayerState() != MediaStatus.PLAYER_STATE_IDLE
                                && status.getPlayerState() != MediaStatus.PLAYER_STATE_LOADING) {
                            lastMedia = client.getMediaInfo();
                        }
                        if (requestingMedia
                                || queueStatusUpdatedCallback != null
                                || queueReloadCallback != null) {
                            return;
                        }

                        if (status != null) {
                            int state = status.getPlayerState();
                            if (lastMedia != null
                                    && state != prevState
                                    && state == MediaStatus.PLAYER_STATE_LOADING) {
                                // It appears the queue has advanced to the next item
                                // So send an update to indicate the previous has finished
                                clientListener.onMediaUpdate(createMediaObject(MediaStatus.IDLE_REASON_FINISHED));
                            }
                            prevState = status.getPlayerState();
                        }
                        // Send update
                        clientListener.onMediaUpdate(createMediaObject());
                    }
                    @Override
                    public void onQueueStatusUpdated() {
                        if (queueStatusUpdatedCallback != null) {
                            queueStatusUpdatedCallback.run();
                            setQueueStatusUpdatedCallback(null);
                        }
                    }
                });
                session.addCastListener(new Cast.Listener() {
                    @Override
                    public void onApplicationStatusChanged() {
                        clientListener.onSessionUpdate(createSessionObject());
                    }
                    @Override
                    public void onApplicationMetadataChanged(ApplicationMetadata appMetadata) {
                        clientListener.onSessionUpdate(createSessionObject());
                    }
                    @Override
                    public void onApplicationDisconnected(int i) {
                        clientListener.onSessionEnd(
                                ChromecastUtilities.createSessionObject(session, "stopped"));
                    }
                    @Override
                    public void onActiveInputStateChanged(int i) {
                        clientListener.onSessionUpdate(createSessionObject());
                    }
                    @Override
                    public void onStandbyStateChanged(int i) {
                        clientListener.onSessionUpdate(createSessionObject());
                    }
                    @Override
                    public void onVolumeChanged() {
                        clientListener.onSessionUpdate(createSessionObject());
                    }
                });
                setupQueue();
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

/* ------------------------------------   MEDIA FNs   ------------------------------------------- */

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
                MediaInfo mediaInfo = ChromecastUtilities.createMediaInfo(contentId, customData, contentType, duration, streamType, metadata, textTrackStyle);
                MediaLoadRequestData loadRequest = new MediaLoadRequestData.Builder()
                        .setMediaInfo(mediaInfo)
                        .setAutoplay(autoPlay)
                        .setCurrentTime((long) currentTime * 1000)
                        .build();

                requestingMedia = true;
                setQueueReloadCallback(new Runnable() {
                    @Override
                    public void run() {
                        callback.success(createMediaObject());
                    }
                });
                client.load(loadRequest).setResultCallback(new ResultCallback<MediaChannelResult>() {
                    @Override
                    public void onResult(@NonNull MediaChannelResult result) {
                        requestingMedia = false;
                        if (!result.getStatus().isSuccess()) {
                            callback.error("session_error");
                        }
                    }
                });
            }
        });
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

/* ------------------------------------   QUEUE FNs   ------------------------------------------- */

    private void setQueueReloadCallback(Runnable callback) {
        this.queueReloadCallback = callback;
    }

    private void setQueueStatusUpdatedCallback(Runnable callback) {
        this.queueStatusUpdatedCallback = callback;
    }

    /**
     * Sets up the objects and listeners required for queue functionality.
     */
    public void setupQueue() {
        MediaQueue queue = client.getMediaQueue();
        queueItems = null;
        ChromecastUtilities.setQueueItems(queueItems);
        queueReloadCallback = null;
        // Set up the queue listener
        queue.registerCallback(new MediaQueue.Callback() {
            private boolean isQueueFinishedLoading = false;
            private ArrayList<Integer> lookingForIndexes = new ArrayList<Integer>();

            private void queueItemsPutAt(int index, JSONObject item) {
                try {
                    queueItems.put(index, item);
                } catch (JSONException e) {
                    e.printStackTrace();
                    throw new RuntimeException("See above stack trace for error: " + e.getMessage());
                }
            }
            private void lookForItems(ArrayList<Integer> indexes) {
                synchronized (queue) {
                    // Merge the two arrays
                    lookingForIndexes.addAll(indexes);
                    checkItems();
                }
            }
            private void checkItems() {
                MediaQueueItem item;
                int index;
                while (lookingForIndexes.size() > 0) {
                    index = lookingForIndexes.get(0);
                    item = queue.getItemAtIndex(index, true);
                    if (item != null) {
                        queueItemsPutAt(index, ChromecastUtilities.createQueueItem(item, index));
                        lookingForIndexes.remove(0);
                    } else {
                        break;
                    }
                }
                if (lookingForIndexes.size() == 0) {
                    updateFinished();
                }
            }
            private void updateFinished() {
                // Update the queueItems
                ChromecastUtilities.setQueueItems(queueItems);
                if (!isQueueFinishedLoading) {
                    isQueueFinishedLoading = true;
                    if (queueReloadCallback != null && queue.getItemCount() > 0) {
                        queueReloadCallback.run();
                        setQueueReloadCallback(null);
                    }
                }
                clientListener.onMediaUpdate(createMediaObject());
            }

            @Override
            public void itemsReloaded() {
                synchronized (queue) {
                    isQueueFinishedLoading = false;
                    int itemCount = queue.getItemCount();
                    if (queueReloadCallback == null) {
                        setQueueReloadCallback(new Runnable() {
                            @Override
                            public void run() {
                                // This was externally loaded
                                clientListener.onMediaLoaded(createMediaObject());
                            }
                        });
                    }
                    // init the arrays
                    ArrayList<Integer> findIndexes = new ArrayList<>();
                    queueItems = new JSONArray();
                    for (int i = 0; i < itemCount; i++) {
                        findIndexes.add(i);
                        queueItems.put(null);
                    }
                    // Start loading the items
                    lookForItems(findIndexes);
                }
            }
            @Override
            public void itemsUpdatedAtIndexes(int[] ints) {
                synchronized (queue) {
                    ArrayList<Integer> unread = new ArrayList<>();
                    for (int i : ints) {
                        if (queue.getItemAtIndex(i) == null) {
                            unread.add(i);
                        }
                    }
                    lookForItems(unread);
                }
            }
            @Override
            public void itemsInsertedInRange(int startIndex, int insertCount) {
                synchronized (queue) {
                    // Make room for inserts
                    for (int i = 0; i < insertCount; i++) {
                        queueItems.put(new JSONObject());
                    }
                    // Shift existing entries
                    for (int i = startIndex; i < startIndex + insertCount; i++) {
                        JSONObject movingObj = new JSONObject();
                        try {
                            movingObj = queueItems.getJSONObject(i);
                        } catch (JSONException e) {
                            e.printStackTrace();
                            throw new RuntimeException("Expected queueItems to contain index: "
                                    + i + " queueItems.length: " + queueItems.length()
                                    + "\nSee above stack trace for error: " + e.getMessage());
                        }
                        queueItemsPutAt(i + insertCount, movingObj);
                    }
                    // Shift the lookingForIndexes
                    int index;
                    for (int i = 0; i < lookingForIndexes.size(); i++) {
                        index = lookingForIndexes.get(i);
                        if (index >= startIndex) {
                            lookingForIndexes.set(i, index + insertCount);
                        }
                    }
                    // null new entries and build indexes array to update
                    ArrayList<Integer> updateIndexes = new ArrayList<>();
                    for (int i = startIndex; i < startIndex + insertCount; i++) {
                        updateIndexes.add(startIndex + i);
                        queueItemsPutAt(startIndex + i, null);
                    }
                    // Trigger the media update
                    lookForItems(updateIndexes);
                }
            }
            @Override
            public void itemsRemovedAtIndexes(int[] ints) {
                synchronized (queue) {
                    ArrayList<Integer> lookingForInts = new ArrayList<Integer>();
                    // Remove the required indexes
                    int index;
                    for (int i : ints) {
                        queueItems.remove(i);
                        // Also, update/remove any references to look for these indexes
                        for (int j = 0; j < lookingForIndexes.size(); j++) {
                            index = lookingForIndexes.get(j);
                            if (index > i) {
                                lookingForInts.add(j, index - 1);
                            } else if (index < i) {
                                lookingForInts.add(index);
                            }
                        }
                        lookingForIndexes = lookingForInts;
                    }
                    // Trigger the media update
                    itemsUpdatedAtIndexes(new int[0]);
                }
            }
        });
    }

    /**
     * Loads a queue of media to the Chromecast.
     * @param queueLoadRequest chrome.cast.media.QueueLoadRequest
     * @param callback called with success or error
     */
    public void queueLoad(JSONObject queueLoadRequest, CallbackContext callback) {
        if (client == null || session == null) {
            callback.error("session_error");
            return;
        }
        activity.runOnUiThread(new Runnable() {
            public void run() {
                try {
                    JSONArray qItems = queueLoadRequest.getJSONArray("items");
                    MediaQueueItem[] items = new MediaQueueItem[qItems.length()];
                    for (int i = 0; i < qItems.length(); i++) {
                        items[i] = ChromecastUtilities.createMediaQueueItem(qItems.getJSONObject(i));
                    }

                    int startIndex = queueLoadRequest.getInt("startIndex");
                    int repeatMode = ChromecastUtilities.getAndroidRepeatMode(queueLoadRequest.getString("repeatMode"));
                    long playPosition = Double.valueOf(items[startIndex].getStartTime() * 1000).longValue();
                    JSONObject customData = null;
                    try {
                        customData = queueLoadRequest.getJSONObject("customData");
                    } catch (JSONException e) {
                    }

                    setQueueReloadCallback(new Runnable() {
                        @Override
                        public void run() {
                            callback.success(createMediaObject());
                        }
                    });
                    client.queueLoad(items, startIndex, repeatMode, playPosition, customData).setResultCallback(new ResultCallback<MediaChannelResult>() {
                        @Override
                        public void onResult(@NonNull MediaChannelResult result) {
                            if (!result.getStatus().isSuccess()) {
                                callback.error("session_error");
                                setQueueReloadCallback(null);
                            }
                        }
                    });
                } catch (JSONException e) {
                    callback.error(ChromecastUtilities.createError("invalid_parameter", e.getMessage()));
                }
            }
        });
    }

    /**
     * Plays the item with itemId in the queue.
     * @param itemId The ID of the item to jump to.
     * @param callback called with .success or .error depending on the result
     */
    public void queueJumpToItem(Integer itemId, CallbackContext callback) {
        if (client == null || session == null) {
            callback.error("session_error");
            return;
        }

        activity.runOnUiThread(new Runnable() {
            public void run() {
                setQueueStatusUpdatedCallback(new Runnable() {
                    @Override
                    public void run() {
                        clientListener.onMediaUpdate(createMediaObject(MediaStatus.IDLE_REASON_INTERRUPTED));
                    }
                });
                client.queueJumpToItem(itemId, null)
                        .setResultCallback(new ResultCallback<MediaChannelResult>() {
                    @Override
                    public void onResult(@NonNull MediaChannelResult result) {

                        if (result.getStatus().isSuccess()) {
                            callback.success();
                        } else {
                            setQueueStatusUpdatedCallback(null);
                            JSONObject errorResult = result.getCustomData();
                            String error = "Failed to jump to queue item with ID: " + itemId;
                            if (errorResult != null) {
                                error += "\nError details: " + errorResult;
                            }
                            callback.error(error);
                        }
                    }
                });
            }
        });
    }

/* ------------------------------------   SESSION FNs ------------------------------------------- */

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

/* ------------------------------------   HELPERS  ---------------------------------------------- */

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
        return ChromecastUtilities.createSessionObject(session);
    }

    /** Last sent media object. **/
    private JSONObject lastMediaObject;
    private JSONObject createMediaObject() {
        return createMediaObject(null);
    }

    private JSONObject createMediaObject(Integer idleReason) {
        if (idleReason != null && lastMediaObject != null) {
            try {
                lastMediaObject.put("playerState", ChromecastUtilities.getMediaPlayerState(MediaStatus.PLAYER_STATE_IDLE));
                lastMediaObject.put("idleReason", ChromecastUtilities.getMediaIdleReason(idleReason));
                return lastMediaObject;
            } catch (JSONException e) {
            }
        }
        JSONObject out = ChromecastUtilities.createMediaObject(session);
        lastMediaObject = out;
        return out;
    }

    interface Listener extends Cast.MessageReceivedCallback {
        void onMediaLoaded(JSONObject jsonMedia);
        void onMediaUpdate(JSONObject jsonMedia);
        void onSessionUpdate(JSONObject jsonSession);
        void onSessionEnd(JSONObject jsonSession);
    }
}
