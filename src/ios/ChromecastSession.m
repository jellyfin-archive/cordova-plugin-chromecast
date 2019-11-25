//
//  ChromecastSession.m
//  ChromeCast
//
//  Created by mac on 2019/9/30.
//

#import "ChromecastSession.h"
#import "CastUtilities.h"

@interface ChromecastSession()
{
    BOOL isRequesting;
}
@property (nonatomic, assign) BOOL isRequesting;
@end

@implementation ChromecastSession
GCKCastSession* currentSession;
CDVInvokedUrlCommand* joinSessionCommand;

- (instancetype)initWithListener:(id<CastSessionListener>)listener cordovaDelegate:(id<CDVCommandDelegate>)cordovaDelegate
{
    self = [super init];
    self.sessionListener = listener;
    self.commandDelegate = cordovaDelegate;
    self.sessionStatus = @"disconnected";
    self.castContext = [GCKCastContext sharedInstance];
    self.sessionManager = self.castContext.sessionManager;
    
    // Ensure we are only listening once after init
    [self.sessionManager removeListener:self];
    [self.sessionManager addListener:self];
    
    return self;
}

- (void)setSession:(GCKCastSession*)session {
    currentSession = session;
    self.sessionStatus = @"connected";
}

- (void)tryRejoin {
    if (currentSession != nil) {
        [self.sessionListener onSessionRejoin:[CastUtilities createSessionObject:currentSession status:self.sessionStatus]];
    }
}

- (void)joinDevice:(GCKDevice*)device cdvCommand:(CDVInvokedUrlCommand*)command {
    joinSessionCommand = command;
    
    [NSUserDefaults.standardUserDefaults setBool:false forKey:@"jump"];
    [NSUserDefaults.standardUserDefaults synchronize];
    [self.sessionManager startSessionWithDevice:device];
}

-(CastRequestDelegate*)createGeneralRequestDelegate:(CDVInvokedUrlCommand*)command {
    [self checkFinishDelegates];
    CastRequestDelegate* delegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        [self.sessionListener onSessionUpdated:[CastUtilities createSessionObject:currentSession status:self.sessionStatus] isAlive:NO];
    } failure:^(GCKError * error) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
    [self.requestDelegates addObject:delegate];
    return delegate;
}

- (void)endSession:(CDVInvokedUrlCommand*)command killSession:(BOOL)killSession {
    BOOL result = [[GCKCastContext sharedInstance].sessionManager endSessionAndStopCasting:killSession];
    if (killSession) {
        self.sessionStatus = @"stopped";
    } else {
        self.sessionStatus = @"disconnected";
    }
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:result];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)setMediaMutedAndVolumeWIthCommand:(CDVInvokedUrlCommand*)command muted:(BOOL)muted nvewLevel:(float)newLevel {
    [self checkFinishDelegates];
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        [self.sessionListener onMediaUpdated:[CastUtilities createMediaObject:currentSession] isAlive:NO];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:currentSession]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        
    } failure:^(GCKError * error) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
    
    [self.requestDelegates addObject:requestDelegate];
    [self.remoteMediaClient setStreamMuted:muted customData:nil];
    self.isRequesting = YES;
    GCKRequest* request = [self.remoteMediaClient setStreamVolume:newLevel customData:nil];
    request.delegate = requestDelegate;
}

- (void)setMediaMutedWIthCommand:(CDVInvokedUrlCommand*)command muted:(BOOL)muted {
    [self checkFinishDelegates];
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        [self.sessionListener onMediaUpdated:[CastUtilities createMediaObject:currentSession] isAlive:NO];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:currentSession]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        
    } failure:^(GCKError * error) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
    
    [self.requestDelegates addObject:requestDelegate];
    self.isRequesting = YES;
    GCKRequest* request = [self.remoteMediaClient setStreamMuted:muted customData:nil];
    request.delegate = requestDelegate;
}

- (void)setMediaVolumeWithCommand:(CDVInvokedUrlCommand*)withCommand newVolumeLevel:(float)newLevel {
    [self checkFinishDelegates];
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        [self.sessionListener onMediaUpdated:[CastUtilities createMediaObject:currentSession] isAlive:NO];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:currentSession]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:withCommand.callbackId];
        
    } failure:^(GCKError * error) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:withCommand.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:withCommand.callbackId];
    }];
    
    [self.requestDelegates addObject:requestDelegate];
    self.isRequesting = YES;
    GCKRequest* request = [self.remoteMediaClient setStreamVolume:newLevel customData:nil];
    request.delegate = requestDelegate;
}

- (void)setReceiverVolumeLevelWithCommand:(CDVInvokedUrlCommand*)withCommand newLevel:(float)newLevel {
    CastRequestDelegate* delegate = [self createGeneralRequestDelegate:withCommand];
    self.isRequesting = YES;
    GCKRequest* request = [currentSession setDeviceVolume:newLevel];
    request.delegate = delegate;
}

- (void)setReceiverMutedWithCommand:(CDVInvokedUrlCommand*)command muted:(BOOL)muted {
    CastRequestDelegate* delegate = [self createGeneralRequestDelegate:command];
    self.isRequesting = YES;
    GCKRequest* request = [currentSession setDeviceMuted:muted];
    request.delegate = delegate;
}

- (void)loadMediaWithCommand:(CDVInvokedUrlCommand*)command mediaInfo:(GCKMediaInformation*)mediaInfo autoPlay:(BOOL)autoPlay currentTime : (double)currentTime {
    [self checkFinishDelegates];
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:currentSession]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } failure:^(GCKError * error) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
    
    [self.requestDelegates addObject:requestDelegate];
    GCKMediaLoadOptions* options = [[GCKMediaLoadOptions alloc] init];
    options.autoplay = autoPlay;
    options.playPosition = currentTime;
    self.isRequesting = YES;
    GCKRequest* request = [self.remoteMediaClient loadMedia:mediaInfo withOptions:options];
    request.delegate = requestDelegate;
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
    [self checkFinishDelegates];
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        [self.sessionListener onMediaUpdated:[CastUtilities createMediaObject:currentSession] isAlive:NO];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:currentSession]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        
    } failure:^(GCKError * error) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
    
    [self.requestDelegates addObject:requestDelegate];
    
    GCKMediaSeekOptions* options = [[GCKMediaSeekOptions alloc] init];
    options.interval = position;
    options.resumeState = resumeState;
    self.isRequesting = YES;
    GCKRequest* request = [self.remoteMediaClient seekWithOptions:options];
    request.delegate = requestDelegate;
}

- (void)queueJumpToItemWithCommand:(CDVInvokedUrlCommand *)command itemId:(NSUInteger)itemId {
    [self checkFinishDelegates];
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:currentSession]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        
    } failure:^(GCKError * error) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
    
    [self.requestDelegates addObject:requestDelegate];
    [NSUserDefaults.standardUserDefaults setBool:true forKey:@"jump"];
    [NSUserDefaults.standardUserDefaults synchronize];
    self.isRequesting = YES;
    GCKRequest* request = [self.remoteMediaClient queueJumpToItemWithID:itemId];
    request.delegate = requestDelegate;
}

- (void)mediaPlayWithCommand:(CDVInvokedUrlCommand*)command {
    [self checkFinishDelegates];
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        [self.sessionListener onMediaUpdated:[CastUtilities createMediaObject:currentSession] isAlive:NO];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:currentSession]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        
    } failure:^(GCKError * error) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
    
    [self.requestDelegates addObject:requestDelegate];
    self.isRequesting = YES;
    GCKRequest* request = [self.remoteMediaClient play];
    request.delegate = requestDelegate;
}

- (void)mediaPauseWithCommand:(CDVInvokedUrlCommand*)command {
    [self checkFinishDelegates];
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        [self.sessionListener onMediaUpdated:[CastUtilities createMediaObject:currentSession] isAlive:NO];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:currentSession]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        
    } failure:^(GCKError * error) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
    
    [self.requestDelegates addObject:requestDelegate];
    self.isRequesting = YES;
    GCKRequest* request = [self.remoteMediaClient pause];
    request.delegate = requestDelegate;
}

- (void)mediaStopWithCommand:(CDVInvokedUrlCommand*)command {
    [self checkFinishDelegates];
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        [self.sessionListener onMediaUpdated:[CastUtilities createMediaObject:currentSession] isAlive:NO];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:currentSession]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        
    } failure:^(GCKError * error) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
    
    [self.requestDelegates addObject:requestDelegate];
    self.isRequesting = YES;
    GCKRequest* request = [self.remoteMediaClient stop];
    request.delegate = requestDelegate;
}

- (void)setActiveTracksWithCommand:(CDVInvokedUrlCommand*)command activeTrackIds:(NSArray<NSNumber*>*)activeTrackIds textTrackStyle:(GCKMediaTextTrackStyle*)textTrackStyle {
    [self checkFinishDelegates];
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        [self.sessionListener onMediaUpdated:[CastUtilities createMediaObject:currentSession] isAlive:NO];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:currentSession]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        
    } failure:^(GCKError * error) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
    
    [self.requestDelegates addObject:requestDelegate];
    self.isRequesting = YES;
    GCKRequest* request = [self.remoteMediaClient setActiveTrackIDs:activeTrackIds];
    request.delegate = requestDelegate;
    request = [self.remoteMediaClient setTextTrackStyle:textTrackStyle];
}

- (void)queueLoadItemsWithCommand:(CDVInvokedUrlCommand *)command queueItems:(NSArray *)queueItems startIndex:(NSInteger)startIndex repeatMode:(GCKMediaRepeatMode)repeatMode {
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:currentSession]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        
    } failure:^(GCKError * error) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
    
    [self.requestDelegates addObject:requestDelegate];
    GCKMediaQueueItem *item = queueItems[startIndex];
    GCKMediaQueueLoadOptions *options = [[GCKMediaQueueLoadOptions alloc] init];
    options.repeatMode = repeatMode;
    options.startIndex = startIndex;
    options.playPosition = item.startTime;
    [NSUserDefaults.standardUserDefaults setBool:false forKey:@"jump"];
    [NSUserDefaults.standardUserDefaults synchronize];
    self.isRequesting = YES;
    GCKRequest* request = [self.remoteMediaClient queueLoadItems:queueItems withOptions:options];
    request.delegate = requestDelegate;
}

- (void) checkFinishDelegates{
    NSMutableArray<CastRequestDelegate*>* tempArray = [NSMutableArray new];
    for (CastRequestDelegate* delegate in self.requestDelegates) {
        if (!delegate.finished ) {
            [tempArray addObject:delegate];
        }
    }
    self.requestDelegates = tempArray;
}

#pragma -- GCKSessionManagerListener
- (void)sessionManager:(GCKSessionManager *)sessionManager didStartCastSession:(GCKCastSession *)session {
    [self setSession:session];
    self.remoteMediaClient = session.remoteMediaClient;
    [self.remoteMediaClient addListener:self];
    if (joinSessionCommand != nil) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary: [CastUtilities createSessionObject:session status:self.sessionStatus] ];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:joinSessionCommand.callbackId];
        joinSessionCommand = nil;
    }
}

- (void)sessionManager:(GCKSessionManager *)sessionManager didEndCastSession:(GCKCastSession *)session withError:(NSError *)error {
    if (error != nil && joinSessionCommand != nil) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.debugDescription];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:joinSessionCommand.callbackId];
        joinSessionCommand = nil;
    }
    if ([self.sessionStatus isEqualToString:@""]) {
        [self.sessionListener onSessionUpdated:[CastUtilities createSessionObject:session status:@"stopped"] isAlive:true];
    } else {
        [self.sessionListener onSessionUpdated:[CastUtilities createSessionObject:session status:self.sessionStatus] isAlive:true];
    }
    currentSession = nil;
}

- (void)sessionManager:(GCKSessionManager *)sessionManager didResumeCastSession:(GCKCastSession *)session {
    [self setSession:session];
    [self.sessionListener onSessionRejoin:[CastUtilities createSessionObject:session status:self.sessionStatus]];
}

#pragma -- GCKRemoteMediaClientListener

- (void)remoteMediaClient:(GCKRemoteMediaClient *)client didStartMediaSessionWithID:(NSInteger)sessionID {
}

- (void)remoteMediaClient:(GCKRemoteMediaClient *)client didUpdateMediaStatus:(GCKMediaStatus *)mediaStatus {
    if (currentSession == nil) {
        [self.sessionListener onMediaUpdated:@{} isAlive:false];
        return;
    }
    
    if (![[NSUserDefaults standardUserDefaults] boolForKey:@"jump"]) {
        NSDictionary* media = [CastUtilities createMediaObject:currentSession];
        [self.sessionListener onMediaUpdated:media isAlive:true];
        if (!self.isRequesting) {
            if (mediaStatus.streamPosition > 0) {
                
                if (mediaStatus.queueItemCount > 1) {
                    [self.sessionListener onMediaLoaded:[CastUtilities createMediaObject:currentSession]];
                    isRequesting = YES;
                }
                else {
                    [self.sessionListener onMediaLoaded:media];
                }
            }

        }
    }
    else {
        NSDictionary* media = [CastUtilities createMediaObject:currentSession];
        [self.sessionListener onMediaUpdated:media isAlive:false];
    }
    
}

- (void)remoteMediaClientDidUpdatePreloadStatus:(GCKRemoteMediaClient *)client {
    [self remoteMediaClient:client didUpdateMediaStatus:nil];
}

- (void)remoteMediaClientDidUpdateQueue:(GCKRemoteMediaClient *)client{
    
}
- (void)remoteMediaClient:(GCKRemoteMediaClient *)client didInsertQueueItemsWithIDs:(NSArray<NSNumber *> *)queueItemIDs beforeItemWithID:(GCKMediaQueueItemID)beforeItemID {
    
}

- (void)remoteMediaClient:(GCKRemoteMediaClient *)client didReceiveQueueItems:(NSArray<GCKMediaQueueItem *> *)queueItems {
    
}

- (void)remoteMediaClient:(GCKRemoteMediaClient *)client didReceiveQueueItemIDs:(NSArray<NSNumber *> *)queueItemIDs {
    
}


#pragma -- GCKGenericChannelDelegate
- (void)castChannel:(GCKGenericChannel *)channel didReceiveTextMessage:(NSString *)message withNamespace:(NSString *)protocolNamespace {
    NSDictionary* session = [CastUtilities createSessionObject:currentSession status:self.sessionStatus];
    [self.sessionListener onMessageReceived:session namespace:protocolNamespace message:message];
}
@end
