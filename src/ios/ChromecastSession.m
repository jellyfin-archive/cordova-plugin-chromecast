//
//  ChromecastSession.m
//  ChromeCast
//
//  Created by mac on 2019/9/30.
//

#import "ChromecastSession.h"
#import "CastUtilities.h"

@implementation ChromecastSession
GCKCastSession* currentSession;
CDVInvokedUrlCommand* joinSessionCommand;
NSDictionary* lastMedia = nil;
void (^loadMediaCallback)(NSString*) = nil;
BOOL isQueueJumping = NO;
BOOL isDisconnecting = NO;
NSMutableArray<void (^)(void)>* endSessionCallbacks;
NSMutableArray<CastRequestDelegate*>* requestDelegates;

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
    // Make sure we are looking at the actual current session, sometimes it doesn't get removed
    [self setSession:self.sessionManager.currentCastSession];
    if (currentSession != nil) {
            [self.sessionListener onSessionRejoin:[CastUtilities createSessionObject:currentSession]];
    }
}

- (void)joinDevice:(GCKDevice*)device cdvCommand:(CDVInvokedUrlCommand*)command {
    joinSessionCommand = command;
    [self.sessionManager startSessionWithDevice:device];
}

-(CastRequestDelegate*)createLoadMediaRequestDelegate:(CDVInvokedUrlCommand*)command {
    loadMediaCallback = ^(NSString* error) {
        if (error) {
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } else {
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:currentSession]];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }
    };
    return [self createRequestDelegate:command success:^{
    } failure:^(GCKError * error) {
        loadMediaCallback = nil;
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        loadMediaCallback = nil;
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

-(CastRequestDelegate*)createSessionUpdateRequestDelegate:(CDVInvokedUrlCommand*)command {
    return [self createRequestDelegate:command success:^{
        [self.sessionListener onSessionUpdated:[CastUtilities createSessionObject:currentSession]];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } failure:nil abortion:nil];
}

-(CastRequestDelegate*)createMediaUpdateRequestDelegate:(CDVInvokedUrlCommand*)command {
    return [self createRequestDelegate:command success:^{
        NSLog(@"%@", [NSString stringWithFormat:@"kk requestDelegate(MediaUpdate) finished"]);
        [self.sessionListener onMediaUpdated:[CastUtilities createMediaObject:currentSession]];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } failure:nil abortion:nil];
}

-(CastRequestDelegate*)createRequestDelegate:(CDVInvokedUrlCommand*)command success:(void(^)(void))success failure:(void(^)(GCKError*))failure abortion:(void(^)(GCKRequestAbortReason))abortion {
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
    CastRequestDelegate* delegate = [[CastRequestDelegate alloc] initWithSuccess:^{
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
    NSLog(@"kk endSession");
    [self endSessionWithCallback:^{
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } killSession:killSession];
}

- (void)endSessionWithCallback:(void(^)(void))callback killSession:(BOOL)killSession {
    NSLog(@"kk endSessionWithCallback");
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
    
    __weak ChromecastSession* weakSelf = self;
    
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

- (void)sendMessageWithCommand:(CDVInvokedUrlCommand*)command namespace:(NSString*)namespace message:(NSString*)message {
    GCKGenericChannel* channel = self.genericChannels[namespace];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:[NSString stringWithFormat:@"Namespace %@ not founded",namespace]];
    
    if (channel != nil) {
        GCKError* error = nil;
        [channel sendTextMessage:message error:&error];
        if (error != nil) {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        } else {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        }
    }
    
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
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
    NSMutableArray<CastRequestDelegate*>* tempArray = [NSMutableArray new];
    for (CastRequestDelegate* delegate in requestDelegates) {
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
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary: [CastUtilities createSessionObject:session] ];
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
        [self.sessionListener onSessionUpdated:[CastUtilities createSessionObject:session status:@"disconnected"]];
    } else {
        [self.sessionListener onSessionUpdated:[CastUtilities createSessionObject:session]];
    }
}

- (void)sessionManager:(GCKSessionManager *)sessionManager didResumeCastSession:(GCKCastSession *)session {
    if (currentSession && currentSession.sessionID == session.sessionID) {
        // ios randomly resumes current session, don't trigger SESSION_LISTENER in this case
        return;
    }
    [self setSession:session];
    [self.sessionListener onSessionRejoin:[CastUtilities createSessionObject:session]];
}

#pragma -- GCKRemoteMediaClientListener

- (void)remoteMediaClient:(GCKRemoteMediaClient *)client didStartMediaSessionWithID:(NSInteger)sessionID {
    // This is not triggered by external loads, so use didReceiveQueueItemIDs instead
}

- (void)remoteMediaClient:(GCKRemoteMediaClient *)client didUpdateMediaStatus:(GCKMediaStatus *)mediaStatus {
    // The following code block is dedicated to catching when the next video in a queue loads so that we can let the user know the video ended.

    // If last media is part of the same/current mediaSession
    // and it is a different media itemId than the current one
    // and there is no idle reason (if there is a reason, that means the status update will probably handle the situation correctly anyways)
    if (lastMedia != nil
        && mediaStatus.mediaSessionID == [lastMedia gck_integerForKey:@"mediaSessionId" withDefaultValue:0]
        && mediaStatus.currentItemID != [lastMedia gck_integerForKey:@"currentItemId" withDefaultValue:-1]
        && mediaStatus.idleReason == GCKMediaPlayerIdleReasonNone) {
        
        // send out out a media update indicated the previous media has finished
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
    lastMedia = [CastUtilities createMediaObject:currentSession];
    [self.sessionListener onMediaUpdated:lastMedia];
}

- (void)remoteMediaClient:(GCKRemoteMediaClient *)client didReceiveQueueItemIDs:(NSArray<NSNumber *> *)queueItemIDs {
    // New media has been loaded, wipe any lastMedia reference
    lastMedia = nil;
    
    // If we do not have a loadMediaCallback that means this was an external media load
    if (!loadMediaCallback) {
        // So set the callback to trigger the MEDIA_LOAD event
        loadMediaCallback = ^(NSString* error) {
            if (!error) {
                [self.sessionListener onMediaLoaded:[CastUtilities createMediaObject:currentSession]];
            }
        };
    }
    
    // When internally loading a queue the media itmes are not always available at this point, so request the items
    GCKRequest* request = [self.remoteMediaClient queueFetchItemsForIDs:queueItemIDs];
    request.delegate = [self createRequestDelegate:nil success:^{
        NSLog(@"%@", [NSString stringWithFormat:@"kk qFetchItemsForIds finished: %lu", (unsigned long)currentSession.remoteMediaClient.mediaStatus.queueItemCount]);
        loadMediaCallback(nil);
        loadMediaCallback = nil;
        NSLog(@"%@", [NSString stringWithFormat:@"kk isLoadingMedia = NO success"]);
    } failure:^(GCKError * error) {
        NSLog(@"%@", [NSString stringWithFormat:@"Failed to retrieve queue items with error: %@", error.description]);
        loadMediaCallback = nil;
        NSLog(@"%@", [NSString stringWithFormat:@"kk isLoadingMedia = NO error2"]);
    } abortion:^(GCKRequestAbortReason abortReason) {
        NSLog(@"%@", [NSString stringWithFormat:@"Failed to retrieve queue items with error: %ld", (long)abortReason]);
        loadMediaCallback = nil;
        NSLog(@"%@", [NSString stringWithFormat:@"kk isLoadingMedia = NO abour2"]);
    }];
}


#pragma -- GCKGenericChannelDelegate
- (void)castChannel:(GCKGenericChannel *)channel didReceiveTextMessage:(NSString *)message withNamespace:(NSString *)protocolNamespace {
    NSDictionary* session = [CastUtilities createSessionObject:currentSession];
    [self.sessionListener onMessageReceived:session namespace:protocolNamespace message:message];
}
@end
