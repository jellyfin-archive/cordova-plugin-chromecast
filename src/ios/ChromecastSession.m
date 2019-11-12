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

- (instancetype)initWithDevice:(GCKDevice*)device cordovaDelegate:(id<CDVCommandDelegate>)cordovaDelegate initialCommand:(CDVInvokedUrlCommand*)initialCommand
{
    self = [super init];
    if (self) {
        self.sessionStatus = @"";
        self.commandDelegate = cordovaDelegate;
        self.initialCommand = initialCommand;
        self.castContext = [GCKCastContext sharedInstance];
        [self.castContext.sessionManager addListener:self];
        [self createSession:device];
    }
    return self;
}

- (void)add:(id<CastSessionListener>)listener {
    self.sessionListener = listener;
}

- (void)createSession:(GCKDevice*)device {
    if (device != nil) {
        [self.castContext.sessionManager startSessionWithDevice:device];
    } else {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot connect to selected cast device."];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.initialCommand.callbackId];
    }
}

-(CastRequestDelegate*)createGeneralRequestDelegate:(CDVInvokedUrlCommand*)command {
    [self checkFinishDelegates];
    CastRequestDelegate* delegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        [self.sessionListener onSessionUpdated:[CastUtilities createSessionObject:self.currentSession] isAlive:NO];
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

- (void)setMediaMutedAndVolumeWIthCommand:(CDVInvokedUrlCommand*)command muted:(BOOL)muted nvewLevel:(float)newLevel {
    [self checkFinishDelegates];
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        [self.sessionListener onMediaUpdated:[CastUtilities createMediaObject:self.currentSession] isAlive:NO];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:self.currentSession]];
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
    GCKRequest* request = [self.remoteMediaClient setStreamVolume:newLevel customData:nil];
    request.delegate = requestDelegate;
}


- (void)setMediaMutedWIthCommand:(CDVInvokedUrlCommand*)command muted:(BOOL)muted {
    [self checkFinishDelegates];
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        [self.sessionListener onMediaUpdated:[CastUtilities createMediaObject:self.currentSession] isAlive:NO];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:self.currentSession]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        
    } failure:^(GCKError * error) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
    
    [self.requestDelegates addObject:requestDelegate];
    GCKRequest* request = [self.remoteMediaClient setStreamMuted:muted customData:nil];
    request.delegate = requestDelegate;
}

- (void)setMediaVolumeWithCommand:(CDVInvokedUrlCommand*)withCommand newVolumeLevel:(float)newLevel {
    [self checkFinishDelegates];
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        [self.sessionListener onMediaUpdated:[CastUtilities createMediaObject:self.currentSession] isAlive:NO];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:self.currentSession]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:withCommand.callbackId];
        
    } failure:^(GCKError * error) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:withCommand.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:withCommand.callbackId];
    }];
    
    [self.requestDelegates addObject:requestDelegate];
    GCKRequest* request = [self.remoteMediaClient setStreamVolume:newLevel customData:nil];
    request.delegate = requestDelegate;
}

- (void)setReceiverVolumeLevelWithCommand:(CDVInvokedUrlCommand*)withCommand newLevel:(float)newLevel {
    CastRequestDelegate* delegate = [self createGeneralRequestDelegate:withCommand];
    GCKRequest* request = [self.currentSession setDeviceVolume:newLevel];
    request.delegate = delegate;
}

- (void)setReceiverMutedWithCommand:(CDVInvokedUrlCommand*)command muted:(BOOL)muted {
    CastRequestDelegate* delegate = [self createGeneralRequestDelegate:command];
    
    GCKRequest* request = [self.currentSession setDeviceMuted:muted];
    request.delegate = delegate;
}

- (void)loadMediaWithCommand:(CDVInvokedUrlCommand*)command mediaInfo:(GCKMediaInformation*)mediaInfo autoPlay:(BOOL)autoPlay currentTime : (double)currentTime {
    [self checkFinishDelegates];
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        self.isRequesting = NO;
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:self.currentSession]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } failure:^(GCKError * error) {
        self.isRequesting = NO;
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        self.isRequesting = NO;
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
    
    [self.requestDelegates addObject:requestDelegate];
    GCKMediaLoadOptions* options = [[GCKMediaLoadOptions alloc] init];
    options.autoplay = autoPlay;
    options.playPosition = currentTime;
    GCKRequest* request = [self.remoteMediaClient loadMedia:mediaInfo withOptions:options];
    isRequesting = YES;
    request.delegate = requestDelegate;
}

- (void)createMessageChannelWithCommand:(CDVInvokedUrlCommand*)command namespace:(NSString*)namespace{
    GCKGenericChannel* newChannel = [[GCKGenericChannel alloc] initWithNamespace:namespace];
    newChannel.delegate = self;
    self.genericChannels[namespace] = newChannel;
    [self.currentSession addChannel:newChannel];
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
        [self.sessionListener onMediaUpdated:[CastUtilities createMediaObject:self.currentSession] isAlive:NO];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:self.currentSession]];
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
    
    GCKRequest* request = [self.remoteMediaClient seekWithOptions:options];
    request.delegate = requestDelegate;
}

- (void)queueJumpToItemWithCommand:(CDVInvokedUrlCommand *)command itemId:(NSUInteger)itemId {
    [self checkFinishDelegates];
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        [NSUserDefaults.standardUserDefaults setBool:true forKey:@"jump"];
        [NSUserDefaults.standardUserDefaults synchronize];
        [self.sessionListener onMediaUpdated:[CastUtilities createMediaObject:self.currentSession] isAlive:NO];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:self.currentSession]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        
    } failure:^(GCKError * error) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
    
    [self.requestDelegates addObject:requestDelegate];
    
    GCKRequest* request = [self.remoteMediaClient queueJumpToItemWithID:itemId];
    
    request.delegate = requestDelegate;
}

- (void)mediaPlayWithCommand:(CDVInvokedUrlCommand*)command {
    [self checkFinishDelegates];
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        [self.sessionListener onMediaUpdated:[CastUtilities createMediaObject:self.currentSession] isAlive:NO];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:self.currentSession]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        
    } failure:^(GCKError * error) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
    
    [self.requestDelegates addObject:requestDelegate];
    
    GCKRequest* request = [self.remoteMediaClient play];
    request.delegate = requestDelegate;
}

- (void)mediaPauseWithCommand:(CDVInvokedUrlCommand*)command {
    [self checkFinishDelegates];
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        [self.sessionListener onMediaUpdated:[CastUtilities createMediaObject:self.currentSession] isAlive:NO];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:self.currentSession]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        
    } failure:^(GCKError * error) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
    
    [self.requestDelegates addObject:requestDelegate];
    
    GCKRequest* request = [self.remoteMediaClient pause];
    request.delegate = requestDelegate;
}

- (void)mediaStopWithCommand:(CDVInvokedUrlCommand*)command {
    [self checkFinishDelegates];
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        [self.sessionListener onMediaUpdated:[CastUtilities createMediaObject:self.currentSession] isAlive:NO];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:self.currentSession]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        
    } failure:^(GCKError * error) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
    
    [self.requestDelegates addObject:requestDelegate];
    
    GCKRequest* request = [self.remoteMediaClient stop];
    request.delegate = requestDelegate;
}

- (void)setActiveTracksWithCommand:(CDVInvokedUrlCommand*)command activeTrackIds:(NSArray<NSNumber*>*)activeTrackIds textTrackStyle:(GCKMediaTextTrackStyle*)textTrackStyle {
    [self checkFinishDelegates];
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        [self.sessionListener onMediaUpdated:[CastUtilities createMediaObject:self.currentSession] isAlive:NO];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObject:self.currentSession]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        
    } failure:^(GCKError * error) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } abortion:^(GCKRequestAbortReason abortReason) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:abortReason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
    
    [self.requestDelegates addObject:requestDelegate];
    GCKRequest* request = [self.remoteMediaClient setActiveTrackIDs:activeTrackIds];
    request.delegate = requestDelegate;
    request = [self.remoteMediaClient setTextTrackStyle:textTrackStyle];
}

- (void)queueLoadItemsWithCommand:(CDVInvokedUrlCommand *)command queueItems:(NSArray *)queueItems startIndex:(NSInteger)startIndex repeatMode:(GCKMediaRepeatMode)repeatMode {
    CastRequestDelegate* requestDelegate = [[CastRequestDelegate alloc] initWithSuccess:^{
        [self.sessionListener onMediaUpdated:[CastUtilities createMediaObjectForQueue:self.currentSession] isAlive:NO];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[CastUtilities createMediaObjectForQueue:self.currentSession]];
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
    self.currentSession = session;
    self.remoteMediaClient = session.remoteMediaClient;
    [self.remoteMediaClient addListener:self];
    
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary: [CastUtilities createSessionObject:session] ];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.initialCommand.callbackId];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager didEndCastSession:(GCKCastSession *)session withError:(NSError *)error {
    self.currentSession = nil;
    self.remoteMediaClient = nil;
    
    if (error != nil) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.debugDescription];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.initialCommand.callbackId];
    }
    if ([self.sessionStatus isEqualToString:@""]) {
        [self.sessionListener onSessionUpdated:[CastUtilities createSessionObject:session] isAlive:false];
    } else {
        [self.sessionListener onSessionUpdated:[CastUtilities createSessionObject:session status:self.sessionStatus] isAlive:false];
    }
    
}

- (void)sessionManager:(GCKSessionManager *)sessionManager didResumeCastSession:(GCKCastSession *)session {
    self.currentSession = session;
    NSLog(@"here is the session");
}

- (void)sessionManager:(GCKSessionManager *)sessionManager didResumeSession:(GCKSession *)session {
    GCKSession *cursession = session;
    NSLog(@"session received");
}

#pragma -- GCKRemoteMediaClientListener
- (void)remoteMediaClient:(GCKRemoteMediaClient *)client didStartMediaSessionWithID:(NSInteger)sessionID {
    NSDictionary* media = [CastUtilities createMediaObject:self.currentSession];
    if (!self.isRequesting) {
//        [self.sessionListener onMediaLoaded:media];
    }
}

- (void)remoteMediaClient:(GCKRemoteMediaClient *)client didUpdateMediaStatus:(GCKMediaStatus *)mediaStatus {
    if (self.currentSession == nil) {
        [self.sessionListener onMediaUpdated:@{} isAlive:false];
        return;
    }
    
    NSDictionary* media = [CastUtilities createMediaObject:self.currentSession];
    [self.sessionListener onMediaUpdated:media isAlive:true];
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
    NSDictionary* currentSession = [CastUtilities createSessionObject:self.currentSession];
    [self.sessionListener onMessageReceived:currentSession namespace:protocolNamespace message:message];
}
@end
