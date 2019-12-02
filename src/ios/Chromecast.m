//
//  Chromecast.m
//  ChromeCast
//
//  Created by mac on 2019/9/30.
//

#import "Chromecast.h"
#import "CastUtilities.h"

#define IDIOM    UI_USER_INTERFACE_IDIOM()
#define IPAD     UIUserInterfaceIdiomPad

@interface Chromecast()
@end

@implementation Chromecast
NSString* appId = nil;
CDVInvokedUrlCommand* scanCommand = nil;
int scansRunning = 0;

- (void)pluginInitialize {
    [super pluginInitialize];
    self.currentSession = [ChromecastSession alloc];
    
    NSString* applicationId = [NSUserDefaults.standardUserDefaults stringForKey:@"appId"];
    if (applicationId == nil) {
        applicationId = kGCKDefaultMediaReceiverApplicationID;
    }
    [self setAppId:applicationId];
}

- (void)setAppId:(NSString*)applicationId {
    if ([applicationId isEqualToString:appId]) {
        return;
    }
    appId = applicationId;
    [NSUserDefaults.standardUserDefaults setObject:appId forKey:@"appId"];
    [[NSUserDefaults standardUserDefaults] synchronize];
    
    GCKDiscoveryCriteria *criteria = [[GCKDiscoveryCriteria alloc]
                                      initWithApplicationID:appId];
    GCKCastOptions *options = [[GCKCastOptions alloc] initWithDiscoveryCriteria:criteria];
    options.physicalVolumeButtonsWillControlDeviceVolume = YES;
    options.disableDiscoveryAutostart = NO;
    [GCKCastContext setSharedInstanceWithOptions:options];

    // Enable chromecast logger.
//    [GCKLogger sharedInstance].delegate = self;
    
    // Ensure we have only 1 listener attached
    [GCKCastContext.sharedInstance.discoveryManager removeListener:self];
    [GCKCastContext.sharedInstance.discoveryManager addListener:self];
    
    self.currentSession = [self.currentSession initWithListener:self cordovaDelegate:self.commandDelegate];
}

// Override CDVPlugin onReset
// Called when the webview navigates to a new page or refreshes
// Clean up any running process
- (void)onReset {
    [self stopRouteScanForSetup];
}

- (void)setup:(CDVInvokedUrlCommand*) command {
    self.eventCommand = command;
    [self stopRouteScanForSetup];
    [self sendEvent:@"SETUP" args:@[]];
}

-(void) initialize:(CDVInvokedUrlCommand*)command {
    [self setAppId:command.arguments[0]];

    // Initialize success
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:@[]];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    
    // Search for existing session
    [self findAvailableReceiver:^{
        [self.currentSession tryRejoin];
    }];
}

- (void)findAvailableReceiver:(void(^)(void))successCallback {
    // Ensure the scan is running
    [self startRouteScan];
    [self retry:^BOOL{
        // Did we find any devices?
        if ([GCKCastContext.sharedInstance.discoveryManager hasDiscoveredDevices]) {
            [self sendReceiverAvailable:YES];
            return YES;
        }
        return NO;
    } forTries:5 callback:^(BOOL passed){
        if (passed) {
            successCallback();
        }
    }];
}

- (void)stopRouteScanForSetup {
    if (scansRunning > 0) {
        // Terminate all scans
        scansRunning = 0;
        [self sendError:@"cancel" message:@"Scan stopped because setup triggered." command:scanCommand];
        scanCommand = nil;
        [self stopRouteScan];
    }
}

- (BOOL)stopRouteScan:(CDVInvokedUrlCommand*)command {
    if (scanCommand != nil) {
        [self stopRouteScan];
        [self sendError:@"cancel" message:@"Scan stopped." command:scanCommand];
        scanCommand = nil;
    }
    if (command != nil) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:@[]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }
    return YES;
}

- (void)stopRouteScan {
    if (--scansRunning <= 0) {
        scansRunning = 0;
        [[GCKCastContext sharedInstance].discoveryManager stopDiscovery];
    }
}

-(BOOL) startRouteScan:(CDVInvokedUrlCommand*)command {
    if (scanCommand != nil) {
        [self sendError:@"cancel" message:@"Started a new route scan before stopping previous one." command:scanCommand];
    } else {
        // Only start the scan if the user has not already started one
        [self startRouteScan];
    }
    scanCommand = command;
    [self sendScanUpdate];
    return YES;
}

-(void) startRouteScan {
    scansRunning++;
    [[GCKCastContext sharedInstance].discoveryManager startDiscovery];
}

- (void)sendScanUpdate {
    if (scanCommand == nil) {
        return;
    }

    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:[CastUtilities createDeviceArray]];
    [pluginResult setKeepCallback:@(true)];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:scanCommand.callbackId];
}

- (void)requestSession:(CDVInvokedUrlCommand*) command {
    UIAlertController* alert = [UIAlertController alertControllerWithTitle:@"Cast to" message:nil preferredStyle:UIAlertControllerStyleActionSheet];
    GCKDiscoveryManager* discoveryManager = GCKCastContext.sharedInstance.discoveryManager;
    for (int i = 0; i < [discoveryManager deviceCount]; i++) {
        GCKDevice* device = [discoveryManager deviceAtIndex:i];
        [alert addAction:[UIAlertAction actionWithTitle:device.friendlyName style:UIAlertActionStyleDefault handler:^(UIAlertAction * _Nonnull action) {
            [self.currentSession joinDevice:device cdvCommand:command];
        }]];
    }
    [alert addAction:[UIAlertAction actionWithTitle:@"Stop Casting" style:UIAlertActionStyleDefault handler:^(UIAlertAction * _Nonnull action) {
        [self.currentSession endSessionWithCallback:^{
            [self sendError:@"cancel" message:@"" command:command];
        } killSession:YES];
    }]];
    [alert addAction:[UIAlertAction actionWithTitle:@"Cancel" style:UIAlertActionStyleCancel handler:^(UIAlertAction * _Nonnull action) {
        [self.currentSession.remoteMediaClient stop];
        [self sendError:@"cancel" message:@"" command:command];
    }]];
    if (IDIOM == IPAD) {
        alert.popoverPresentationController.sourceView = self.webView;
        CGRect frame = CGRectMake(self.webView.frame.size.width/2, self.webView.frame.size.height, self.webView.bounds.size.width/2, self.webView.bounds.size.height);
        alert.popoverPresentationController.sourceRect = frame;
    }
    [self.viewController presentViewController:alert animated:YES completion:nil];
}

- (void)queueLoad:(CDVInvokedUrlCommand *)command {
    NSDictionary *request = command.arguments[0];
    NSArray *items = request[@"items"];
    NSInteger startIndex = [request[@"startIndex"] integerValue];
    NSString *repeadModeString = request[@"repeatMode"];
    GCKMediaRepeatMode repeatMode = GCKMediaRepeatModeAll;
    if ([repeadModeString isEqualToString:@"REPEAT_OFF"]) {
        repeatMode = GCKMediaRepeatModeOff;
    }
    else if ([repeadModeString isEqualToString:@"REPEAT_ALL"]) {
        repeatMode = GCKMediaRepeatModeAll;
    }
    else if ([repeadModeString isEqualToString:@"REPEAT_SINGLE"]) {
        repeatMode = GCKMediaRepeatModeSingle;
    }
    else if ([repeadModeString isEqualToString:@"REPEAT_ALL_AND_SHUFFLE"]) {
        repeatMode = GCKMediaRepeatModeAllAndShuffle;
    }
    
    //GCKMediaInformation* mediaInfo = [CastUtilities buildMediaInformation:contentId customData:customData contentType:contentType duration:duration streamType:streamType textTrackStyle:textTrackStyle metaData:metadata];
    
    NSMutableArray *queueItems = [[NSMutableArray alloc] init];
    
    for (NSDictionary *item in items) {
        GCKMediaQueueItemBuilder *queueItemBuilder = [[GCKMediaQueueItemBuilder alloc] init];
        queueItemBuilder.activeTrackIDs = item[@"activeTrackIds"];
        queueItemBuilder.autoplay = [item[@"autoplay"] boolValue];
        queueItemBuilder.customData = item[@"customData"];
        NSDictionary *media = item[@"media"];
        queueItemBuilder.startTime = [item[@"startTime"] doubleValue];
        queueItemBuilder.preloadTime = [item[@"preloadTime"] doubleValue];
        double duration = media[@"duration"] == [NSNull null] ? 0 : [media[@"duration"] doubleValue];
        
        GCKMediaInformation *mediaInformation = [CastUtilities buildMediaInformationForQueueItem:media[@"contentId"] customData:media[@"customData"] contentType:media[@"contentType"] duration:duration startTime:0 streamType:media[@"streamType"] metaData:media[@"metadata"]];
        queueItemBuilder.mediaInformation = mediaInformation;
        [queueItems addObject: [queueItemBuilder build]];
    }
    [self.currentSession queueLoadItemsWithCommand:command queueItems:queueItems startIndex:startIndex repeatMode:repeatMode];
}

- (void)queueJumpToItem:(CDVInvokedUrlCommand *)command {
    NSUInteger itemId = [command.arguments[0] unsignedIntegerValue];
    [self.currentSession queueJumpToItemWithCommand:command itemId:itemId];
}

- (void)setMediaVolume:(CDVInvokedUrlCommand*) command {
    [self.currentSession setMediaMutedAndVolumeWithCommand:command];
}

- (void)setReceiverVolumeLevel:(CDVInvokedUrlCommand*) command {
    double newLevel = 1.0;
    if (command.arguments[0]) {
        newLevel = [command.arguments[0] doubleValue];
    } else {
        newLevel = 1.0;
    }
    [self.currentSession setReceiverVolumeLevelWithCommand:command newLevel:newLevel];
}

- (void)setReceiverMuted:(CDVInvokedUrlCommand*) command {
    BOOL muted = NO;
    if (command.arguments[0]) {
        muted = [command.arguments[0] boolValue];
    }
    [self.currentSession setReceiverMutedWithCommand:command muted:muted];
}

- (void)sessionStop:(CDVInvokedUrlCommand*)command {
    [self.currentSession endSession:command killSession:YES];
}

- (void)sessionLeave:(CDVInvokedUrlCommand*) command {
    [self.currentSession endSession:command killSession:NO];
}

- (void)loadMedia:(CDVInvokedUrlCommand*) command {
    NSString* contentId = command.arguments[0];
    NSObject* customData = command.arguments[1];
    NSString* contentType = command.arguments[2];
    double duration = [command.arguments[3] doubleValue];
    NSString* streamType = command.arguments[4];
    BOOL autoplay = [command.arguments[5] boolValue];
    double currentTime = [command.arguments[6] doubleValue];
    NSDictionary* metadata = command.arguments[7];
    NSDictionary* textTrackStyle = command.arguments[8];
    GCKMediaInformation* mediaInfo = [CastUtilities buildMediaInformation:contentId customData:customData contentType:contentType duration:duration streamType:streamType textTrackStyle:textTrackStyle metaData:metadata];
    [self.currentSession loadMediaWithCommand:command mediaInfo:mediaInfo autoPlay:autoplay currentTime:currentTime];
}

- (void)addMessageListener:(CDVInvokedUrlCommand*)command {
    NSString* namespace = command.arguments[0];
    [self.currentSession createMessageChannelWithCommand:command namespace:namespace];
}

- (void)sendMessage:(CDVInvokedUrlCommand*) command {
    NSString* namespace = command.arguments[0];
    NSString* message = command.arguments[1];
    
    [self.currentSession sendMessageWithCommand:command namespace:namespace message:message];
}

- (void)mediaPlay:(CDVInvokedUrlCommand*)command {
    [self.currentSession mediaPlayWithCommand:command];
}

- (void)mediaPause:(CDVInvokedUrlCommand*)command {
    [self.currentSession mediaPauseWithCommand:command];
}

- (void)mediaSeek:(CDVInvokedUrlCommand*)command {
    int currentTime = [command.arguments[0] doubleValue];
    NSString* resumeState = command.arguments[1];
    GCKMediaResumeState resumeStateObj = [CastUtilities parseResumeState:resumeState];
    [self.currentSession mediaSeekWithCommand:command position:currentTime resumeState:resumeStateObj];
}

- (void)mediaStop:(CDVInvokedUrlCommand*)command {
    [self.currentSession mediaStopWithCommand:command];
}

- (void)mediaEditTracksInfo:(CDVInvokedUrlCommand*)command {
    NSArray<NSNumber*>* activeTrackIds = command.arguments[0];
    NSData* textTrackStyle = command.arguments[1];
    
    GCKMediaTextTrackStyle* textTrackStyleObject = [CastUtilities buildTextTrackStyle:textTrackStyle];
    [self.currentSession setActiveTracksWithCommand:command activeTrackIds:activeTrackIds textTrackStyle:textTrackStyleObject];
}

- (void)selectRoute:(CDVInvokedUrlCommand*)command {
    GCKCastSession* currentSession = [GCKCastContext sharedInstance].sessionManager.currentCastSession;
    if (currentSession != nil
        || [currentSession connectionState] == GCKConnectionStateConnected
        || [currentSession connectionState] == GCKConnectionStateConnecting) {
        [self sendError:@"session_error" message:@"Leave or stop current session before attempting to join new session." command:command];
        return;
    }
    
    NSString* routeID = command.arguments[0];
    // Ensure the scan is running
    [self startRouteScan];
    
    [self retry:^BOOL{
        GCKDevice* device = [[GCKCastContext sharedInstance].discoveryManager deviceWithUniqueID:routeID];
        if (device != nil) {
            [self.currentSession joinDevice:device cdvCommand:command];
            return YES;
        }
        return NO;
    } forTries:5 callback:^(BOOL passed) {
        if (!passed) {
            [self sendError:@"timeout" message:[NSString stringWithFormat:@"Failed to join route (%@) after 15s and %d tries.", routeID, 15] command:command];
        }
        [self stopRouteScan];
    }];
}

// retries every 1 second forTries times
// pass -1 to forTries to try infinitely
- (void)retry:(BOOL(^)(void))condition forTries:(int)remainTries callback:(void(^)(BOOL))callback {
    BOOL passed = condition();
    if (passed || remainTries == 0) {
        callback(passed);
        return;
    }

    remainTries--;
    
    // check again in 1 second
    NSMethodSignature *signature  = [self methodSignatureForSelector:@selector(retry:forTries:callback:)];
    NSInvocation      *invocation = [NSInvocation invocationWithMethodSignature:signature];
    [invocation setTarget:self];
    [invocation setSelector:_cmd];
    [invocation setArgument:&condition atIndex:2];
    [invocation setArgument:&remainTries atIndex:3];
    [invocation setArgument:&callback atIndex:4];
    [NSTimer scheduledTimerWithTimeInterval:1 invocation:invocation repeats:NO];
}

#pragma GCKLoggerDelegate
- (void)logMessage:(NSString *)message atLevel:(GCKLoggerLevel)level fromFunction:(NSString *)function location:(NSString *)location {
    NSLog(@"%@", [NSString stringWithFormat:@"GCKLogger = %@, %ld, %@, %@", message,(long)level,function,location]);
}

#pragma GCKDiscoveryManagerListener

- (void) didUpdateDeviceList {
    BOOL receiverAvailable = [GCKCastContext.sharedInstance.discoveryManager deviceCount] > 0 ? YES : NO;
    [self sendReceiverAvailable:receiverAvailable];
    [self sendScanUpdate];
}

#pragma CastSessionListener

- (void)onMediaLoaded:(NSDictionary *)media {
    [self sendEvent:@"MEDIA_LOAD" args:@[media]];
}

- (void)onMediaUpdated:(NSDictionary *)media {
    [self sendEvent:@"MEDIA_UPDATE" args:@[media]];
}

- (void)onSessionRejoin:(NSDictionary*)session {
    [self sendEvent:@"SESSION_LISTENER" args:@[session]];
}

- (void)onSessionUpdated:(NSDictionary *)session {
    [self sendEvent:@"SESSION_UPDATE" args:@[session]];
}

- (void)onMessageReceived:(NSDictionary *)session namespace:(NSString *)namespace message:(NSString *)message {
    [self sendEvent:@"RECEIVER_MESSAGE" args:@[namespace,message]];
}

- (void)onSessionEnd:(NSDictionary *)session {
    [self sendEvent:@"SESSION_UPDATE" args:@[session]];
}

- (void)onCastStateChanged:(NSNotification*)notification {
    GCKCastState castState = [notification.userInfo[kGCKNotificationKeyCastState] intValue];
    [self sendReceiverAvailable:(castState == GCKCastStateNoDevicesAvailable)];
}

- (void)sendReceiverAvailable:(BOOL)available {
    [self sendEvent:@"RECEIVER_LISTENER" args:@[@(available)]];
}

- (void)sendEvent:(NSString *)eventName args:(NSArray *)args{
    //    NSLog(@"Event Name: %@", eventName);
    if (self.eventCommand == nil) {
        return;
    }
    NSMutableArray* argArray = [[NSMutableArray alloc] initWithArray:@[eventName]];
    [argArray addObject:args];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:argArray];
    [pluginResult setKeepCallback:@(true)];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.eventCommand.callbackId];
}

- (void)sendError:(NSString *)code message:(NSString *)message command:(CDVInvokedUrlCommand*)command{
    
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:[CastUtilities createError:code message:message]];
    
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

@end
