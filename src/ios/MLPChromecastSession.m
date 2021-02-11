//
//  MLPChromecastSession.m
//  ChromeCast

#import "MLPChromecastSession.h"
#import "MLPCastUtilities.h"

@implementation MLPChromecastSession
GCKCastSession* currentSession;
CDVInvokedUrlCommand* joinSessionCommand;
NSDictionary* lastMedia = nil;
void (^loadMediaCallback)(NSString*) = nil;
BOOL isResumingSession = NO;
BOOL isQueueJumping = NO;
BOOL isDisconnecting = NO;
NSMutableArray<void (^)(void)>* endSessionCallbacks;
NSMutableArray<MLPCastRequestDelegate*>* requestDelegates;

- (instancetype)initWithListener:(id<CastSessionListener>)listener cordovaDelegate:(id<CDVCommandDelegate>)cordovaDelegate
{
    self = [super init];
    requestDelegates = [NSMutableArray new];
    endSessionCallbacks = [NSMutableArray new];
    self.sessionListener = listener;
    self.commandDelegate = cordovaDelegate;
    self.castContext = [GCKCastContext sharedInstance];
    self.sessionManager = self.castContext.sessionManager;
    
    // Ensure we are only listening once after init
    [self.sessionManager removeListener:self];
    [self.sessionManager addListener:self];
    
    return self;
}

- (void)setSession:(GCKCastSession*)session {
    currentSession = session;
}

- (void)tryRejoin {
    if (currentSession == nil) {
        // if the currentSession is null we should handle any potential resuming in didResumeCastSession
        return;
    }
    // Make sure we are looking at the actual current session, sometimes it doesn't get removed
    [self setSession:self.sessionManager.currentCastSession];
    // Only if the session exists, is connected, and we are not already resuming the session
    if (currentSession != nil && currentSession.connectionState != GCKConnectionStateDisconnected && isResumingSession == NO) {
        // Trigger the SESSION_LISTENER
        [self.sessionListener onSessionRejoin:[MLPCastUtilities createSessionObject:currentSession]];
    }
}

- (void)joinDevice:(GCKDevice*)device cdvCommand:(CDVInvokedUrlCommand*)command {
    joinSessionCommand = command;
    BOOL startedSuccessfully = [self.sessionManager startSessionWithDevice:device];
    if (!startedSuccessfully) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Failed to join the selected route"];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }
}

-(MLPCastRequestDelegate*)createLoadMediaRequestDelegate:(CDVInvokedUrlCommand*)command {
    loadMediaCallback = ^(NSString* error) {
        if (error) {
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } else {
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[MLPCastUtilities createMediaObject:currentSession]];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }
    };
    return [self createRequestDelegate:command success:^{
    } failure:^(GCKError * error) {
        loadMediaCallback(error.description);
        loadMediaCallback = nil;
    } abortion:^(GCKRequestAbortReason abortReason) {
        if (abortReason == GCKRequestAbortReasonReplaced) {
            loadMediaCallback(@"aborted loadMedia/queueLoad request reason: GCKRequestAbortReasonReplaced");
        } else if (abortReason == GCKRequestAbortReasonCancelled) {
            loadMediaCallback(@"aborted loadMedia/queueLoad request reason: GCKRequestAbortReasonCancelled");
        }
        loadMediaCallback = nil;
    }];
}

-(MLPCastRequestDelegate*)createSessionUpdateRequestDelegate:(CDVInvokedUrlCommand*)command {
    return [self createRequestDelegate:command success:^{
        [self.sessionListener onSessionUpdated:[MLPCastUtilities createSessionObject:currentSession]];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } failure:nil abortion:nil];
}

-(MLPCastRequestDelegate*)createMediaUpdateRequestDelegate:(CDVInvokedUrlCommand*)command {
    return [self createRequestDelegate:command success:^{
        [self.sessionListener onMediaUpdated:[MLPCastUtilities createMediaObject:currentSession]];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } failure:nil abortion:nil];
}

-(MLPCastRequestDelegate*)createRequestDelegate:(CDVInvokedUrlCommand*)command success:(void(^)(void))success failure:(void(^)(GCKError*))failure abortion:(void(^)(GCKRequestAbortReason))abortion {
    // set up any required defaults
    if (success == nil) {
        success = ^{
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        };
    }
    if (failure == nil) {
        failure = ^(GCKError * error) {
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        };
    }
    if (abortion == nil) {
        abortion = ^(GCKRequestAbortReason abortReason) {
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        };
    }
    MLPCastRequestDelegate* delegate = [[MLPCastRequestDelegate alloc] initWithSuccess:^{
        [self checkFinishDelegates];
        success();
    } failure:^(GCKError * error) {
        [self checkFinishDelegates];
        failure(error);
    } abortion:^(GCKRequestAbortReason abortReason) {
        [self checkFinishDelegates];
        abortion(abortReason);
    }];
    
    [requestDelegates addObject:delegate];
    return delegate;
}

- (void)endSession:(CDVInvokedUrlCommand*)command killSession:(BOOL)killSession {
    [self endSessionWithCallback:^{
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } killSession:killSession];
}

- (void)endSessionWithCallback:(void(^)(void))callback killSession:(BOOL)killSession {
    [endSessionCallbacks addObject:callback];
    if (killSession) {
        [currentSession endWithAction:GCKSessionEndActionStopCasting];
    } else {
        isDisconnecting = YES;
        [currentSession endWithAction:GCKSessionEndActionLeave];
    }
}

- (void)setMediaMutedAndVolumeWithCommand:(CDVInvokedUrlCommand*)command {
    GCKMediaStatus* mediaStatus = currentSession.remoteMediaClient.mediaStatus;
    // set muted to the current state
    BOOL muted = mediaStatus.isMuted;
    // If we have the muted argument
    if (command.arguments[1] != [NSNull null]) {
        // Update muted
        muted = [command.arguments[1] boolValue];
    }
    
    __weak MLPChromecastSession* weakSelf = self;
    
    void (^setMuted)(void) = ^{
        // Now set the volume
        GCKRequest* request = [weakSelf.remoteMediaClient setStreamMuted:muted customData:nil];
        request.delegate = [weakSelf createMediaUpdateRequestDelegate:command];
    };
    
    // Set an invalid newLevel for default
    double newLevel = -1;
    // Get the newLevel argument if possible
    if (command.arguments[0] != [NSNull null]) {
        newLevel = [command.arguments[0] doubleValue];
    }
    
    if (newLevel == -1) {
        // We have no newLevel, so only set muted state
        setMuted();
    } else {
        // We have both muted and newLevel, so set volume, then muted
        GCKRequest* request = [self.remoteMediaClient setStreamVolume:newLevel customData:nil];
        request.delegate = [self createRequestDelegate:command success:setMuted failure:nil abortion:nil];
    }
}

- (void)setReceiverVolumeLevelWithCommand:(CDVInvokedUrlCommand*)command newLevel:(float)newLevel {
    GCKRequest* request = [currentSession setDeviceVolume:newLevel];
    request.delegate = [self createSessionUpdateRequestDelegate:command];
}

- (void)setReceiverMutedWithCommand:(CDVInvokedUrlCommand*)command muted:(BOOL)muted {
    GCKRequest* request = [currentSession setDeviceMuted:muted];
    request.delegate = [self createSessionUpdateRequestDelegate:command];
}

- (void)loadMediaWithCommand:(CDVInvokedUrlCommand*)command mediaInfo:(GCKMediaInformation*)mediaInfo autoPlay:(BOOL)autoPlay currentTime : (double)currentTime {
    GCKMediaLoadOptions* options = [[GCKMediaLoadOptions alloc] init];
    options.autoplay = autoPlay;
    options.playPosition = currentTime;
    GCKRequest* request = [self.remoteMediaClient loadMedia:mediaInfo withOptions:options];
    request.delegate = [self createLoadMediaRequestDelegate:command];
}

- (void)createMessageChannelWithCommand:(CDVInvokedUrlCommand*)command namespace:(NSString*)namespace{
    GCKGenericChannel* newChannel = [[GCKGenericChannel alloc] initWithNamespace:namespace];
    newChannel.delegate = self;
    self.genericChannels[namespace] = newChannel;
    [currentSession addChannel:newChannel];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)sendMessageWithCommand:(CDVInvokedUrlCommand*)command namespace:(NSString*)namespace message:(NSString*)message{

    GCKGenericChannel* newChannel = [[GCKGenericChannel alloc] initWithNamespace:namespace];
    newChannel.delegate = self;
    self.genericChannels[namespace] = newChannel;
    [currentSession addChannel:newChannel];

    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:[NSString stringWithFormat:@"Namespace %@ not found",namespace]];
    
    if(newChannel != nil) {
        GCKError* error = nil;
        [newChannel sendTextMessage:message error:&error];
        if (error != nil) {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        } else {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        }
    }
}

- (void)mediaSeekWithCommand:(CDVInvokedUrlCommand*)command position:(NSTimeInterval)position resumeState:(GCKMediaResumeState)resumeState {
    GCKMediaSeekOptions* options = [[GCKMediaSeekOptions alloc] init];
    options.interval = position;
    options.resumeState = resumeState;
    GCKRequest* request = [self.remoteMediaClient seekWithOptions:options];
    request.delegate = [self createMediaUpdateRequestDelegate:command];
}

- (void)queueJumpToItemWithCommand:(CDVInvokedUrlCommand *)command itemId:(NSUInteger)itemId {
    isQueueJumping = YES;
    GCKRequest* request = [self.remoteMediaClient queueJumpToItemWithID:itemId];
    request.delegate = [self createRequestDelegate:command success:nil failure:^(GCKError * error) {
        isQueueJumping = NO;
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        isQueueJumping = NO;
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void)mediaPlayWithCommand:(CDVInvokedUrlCommand*)command {
    GCKRequest* request = [self.remoteMediaClient play];
    request.delegate = [self createMediaUpdateRequestDelegate:command];
}

- (void)mediaPauseWithCommand:(CDVInvokedUrlCommand*)command {
    GCKRequest* request = [self.remoteMediaClient pause];
    request.delegate = [self createMediaUpdateRequestDelegate:command];
}

- (void)mediaStopWithCommand:(CDVInvokedUrlCommand*)command {
    GCKRequest* request = [self.remoteMediaClient stop];
    request.delegate = [self createMediaUpdateRequestDelegate:command];
}

- (void)setActiveTracksWithCommand:(CDVInvokedUrlCommand*)command activeTrackIds:(NSArray<NSNumber*>*)activeTrackIds textTrackStyle:(GCKMediaTextTrackStyle*)textTrackStyle {
    GCKRequest* request = [self.remoteMediaClient setActiveTrackIDs:activeTrackIds];
    request.delegate = [self createMediaUpdateRequestDelegate:command];
    request = [self.remoteMediaClient setTextTrackStyle:textTrackStyle];
}

- (void)queueLoadItemsWithCommand:(CDVInvokedUrlCommand *)command queueItems:(NSArray *)queueItems startIndex:(NSInteger)startIndex repeatMode:(GCKMediaRepeatMode)repeatMode {
    GCKMediaQueueItem *item = queueItems[startIndex];
    GCKMediaQueueLoadOptions *options = [[GCKMediaQueueLoadOptions alloc] init];
    options.repeatMode = repeatMode;
    options.startIndex = startIndex;
    options.playPosition = item.startTime;
    GCKRequest* request = [self.remoteMediaClient queueLoadItems:queueItems withOptions:options];
    request.delegate = [self createLoadMediaRequestDelegate:command];
}

- (void) checkFinishDelegates {
    NSMutableArray<MLPCastRequestDelegate*>* tempArray = [NSMutableArray new];
    for (MLPCastRequestDelegate* delegate in requestDelegates) {
        if (!delegate.finished ) {
            [tempArray addObject:delegate];
        }
    }
    requestDelegates = tempArray;
}

#pragma -- GCKSessionManagerListener
- (void)sessionManager:(GCKSessionManager *)sessionManager didStartCastSession:(GCKCastSession *)session {
    [self setSession:session];
    self.remoteMediaClient = session.remoteMediaClient;
    [self.remoteMediaClient addListener:self];
    if (joinSessionCommand != nil) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary: [MLPCastUtilities createSessionObject:session] ];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:joinSessionCommand.callbackId];
        joinSessionCommand = nil;
    }
}

- (void)sessionManager:(GCKSessionManager *)sessionManager didEndCastSession:(GCKCastSession *)session withError:(NSError *)error {
    // Clear the session
    currentSession = nil;
    
    // Did we fail on a join session command?
    if (error != nil && joinSessionCommand != nil) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.debugDescription];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:joinSessionCommand.callbackId];
        joinSessionCommand = nil;
        return;
    }
    
    // Call all callbacks that are waiting for session end
    for (void (^endSessionCallback)(void) in endSessionCallbacks) {
        endSessionCallback();
    }
    // And remove the callbacks
    endSessionCallbacks = [NSMutableArray new];
    
    // Are we just leaving the session? (leaving results in disconnected status)
    if (isDisconnecting) {
        // Clear isDisconnecting
        isDisconnecting = NO;
        [self.sessionListener onSessionUpdated:[MLPCastUtilities createSessionObject:session status:@"disconnected"]];
    } else {
        [self.sessionListener onSessionUpdated:[MLPCastUtilities createSessionObject:session]];
    }
}

- (void)sessionManager:(GCKSessionManager *)sessionManager didResumeCastSession:(GCKCastSession *)session {
    if (currentSession && currentSession.sessionID == session.sessionID) {
        // ios randomly resumes current session, don't trigger SESSION_LISTENER in this case
        return;
    }
    
    isResumingSession = YES;
    // Do all the setup/configuration required when we get a session
    [self sessionManager:sessionManager didStartCastSession:session];
    
    // Delay returning the resumed session, so that ios has a chance to get any media first
    // If we return immediately, the session may be sent out without media even though there should be
    // The case where a session is resumed that has no media will have to wait the full 2s before being sent
    [MLPCastUtilities retry:^BOOL{
        // Did we find any media?
        if (session.remoteMediaClient.mediaStatus != nil) {
            // No need to wait any longer
            return YES;
        }
        return NO;
    } forTries:2 callback:^(BOOL passed){
        // trigger the SESSION_LISTENER event
        [self.sessionListener onSessionRejoin:[MLPCastUtilities createSessionObject:session]];
        // We are done resuming
        isResumingSession = NO;
    }];
    
}

#pragma -- GCKRemoteMediaClientListener

- (void)remoteMediaClient:(GCKRemoteMediaClient *)client didUpdateMediaStatus:(GCKMediaStatus *)mediaStatus {
    // The following code block is dedicated to catching when the next video in a queue loads so that we can let the user know the video ended.
    
    // If lastMedia and current media are part of the same mediaSession
    // AND if the currentItemID has changed
    // AND if there is no idle reason, that means that video just moved onto to the next video naturally (eg. next video in a queue).  We have to handle this case manually. Other ways resulting in currentItemID changing are handled without additional assistance
    if (lastMedia != nil
        && mediaStatus.mediaSessionID == [lastMedia gck_integerForKey:@"mediaSessionId" withDefaultValue:0]
        && mediaStatus.currentItemID != [lastMedia gck_integerForKey:@"currentItemId" withDefaultValue:-1]
        && mediaStatus.idleReason == GCKMediaPlayerIdleReasonNone) {
        
        // send out a media update to indicate that the previous media has finished
        NSMutableDictionary* lastMediaMutable = [lastMedia mutableCopy];
        lastMediaMutable[@"playerState"] = @"IDLE";
        if (isQueueJumping) {
            lastMediaMutable[@"idleReason"] = @"INTERRUPTED";
            // reset isQueueJumping
            isQueueJumping = NO;
        } else {
            lastMediaMutable[@"idleReason"] = @"FINISHED";
        }
        [self.sessionListener onMediaUpdated:lastMediaMutable];
    }
    
    // update the last media now
    lastMedia = [MLPCastUtilities createMediaObject:currentSession];
    // Only send updates if we aren't loading media
    if (!loadMediaCallback && !isResumingSession) {
        [self.sessionListener onMediaUpdated:lastMedia];
    }
}

- (void)remoteMediaClient:(GCKRemoteMediaClient *)client didReceiveQueueItemIDs:(NSArray<NSNumber *> *)queueItemIDs {
    // New media has been loaded, wipe any lastMedia reference
    lastMedia = nil;
    // Save the queueItemIDs in cast utilities so it can be used when building queue items
    [MLPCastUtilities setQueueItemIDs:queueItemIDs];
    
    // If we do not have a loadMediaCallback that means this was an external media load
    if (!loadMediaCallback) {
        // So set the callback to trigger the MEDIA_LOAD event
        loadMediaCallback = ^(NSString* error) {
            if (error) {
                NSLog(@"%@%@", @"Chromecast Error: ", error);
            } else {
                [self.sessionListener onMediaLoaded:[MLPCastUtilities createMediaObject:currentSession]];
            }
        };
    }
    
    // When internally loading a queue the media itmes are not always available at this point, so request the items
    GCKRequest* request = [self.remoteMediaClient queueFetchItemsForIDs:queueItemIDs];
    request.delegate = [self createRequestDelegate:nil success:^{
        loadMediaCallback(nil);
        loadMediaCallback = nil;
    } failure:^(GCKError * error) {
        loadMediaCallback([GCKError enumDescriptionForCode:error.code]);
        loadMediaCallback = nil;
    } abortion:^(GCKRequestAbortReason abortReason) {
        if (abortReason == GCKRequestAbortReasonReplaced) {
            loadMediaCallback(@"aborted loadMedia/queueLoad fetch request reason: GCKRequestAbortReasonReplaced");
        } else if (abortReason == GCKRequestAbortReasonCancelled) {
            loadMediaCallback(@"aborted loadMedia/queueLoad fetch request reason: GCKRequestAbortReasonCancelled");
        }
        loadMediaCallback = nil;
    }];
}


#pragma -- GCKGenericChannelDelegate
- (void)castChannel:(GCKGenericChannel *)channel didReceiveTextMessage:(NSString *)message withNamespace:(NSString *)protocolNamespace {
    NSDictionary* session = [MLPCastUtilities createSessionObject:currentSession];
    [self.sessionListener onMessageReceived:session namespace:protocolNamespace message:message];
}
@end
