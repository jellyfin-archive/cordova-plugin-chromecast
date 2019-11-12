//
//  CastRequestDelegate.m
//  ChromeCast
//
//  Created by mac on 2019/9/30.
//

#import "CastRequestDelegate.h"

@implementation CastConnectionListener

- (instancetype)initWithReceiverAvailableUpdate:(void(^)(BOOL available))onReceiverAvailableUpdate onSessionRejoin:(void(^)(NSDictionary* session))onSessionRejoin onMediaLoaded:(void(^)(NSDictionary* media))onMediaLoaded onMediaUpdated:(void(^)(NSDictionary* media, BOOL isAlive))onMediaUpdated onSessionUpdated:(void(^)(NSDictionary* session, BOOL isAlive))onSessionUpdated onSessionEnd:(void(^)(NSDictionary* session))onSessionEnd onMessageReceived:(void(^)(NSDictionary* session,NSString* namespace,NSString* message))onMessageReceived  {
    
    self = [super init];
    if (self) {
        self.onReceiverAvailableUpdate = onReceiverAvailableUpdate;
        self.onSessionRejoin = onSessionRejoin;
        onMediaLoaded = onMediaLoaded;
        onSessionUpdated = onSessionUpdated;
        onMediaUpdated = onMediaUpdated;
        onSessionEnd = onSessionEnd;
        onMessageReceived = onMessageReceived;
        
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onCastStateChanged:) name:kGCKCastStateDidChangeNotification object:nil];
    }
    return self;
}

- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)onCastStateChanged:(NSNotification*)notification {
    GCKCastState castState = [notification.userInfo[kGCKNotificationKeyCastState] intValue];
    if (castState == GCKCastStateNoDevicesAvailable) {
        self.onReceiverAvailableUpdate(false);
    } else {
        self.onReceiverAvailableUpdate(true);
    }
}

- (void)onMediaUpdated:(NSDictionary *)media isAlive:(BOOL)isAlive {
    onMediaUpdated(media,isAlive);
}

- (void)onMediaLoaded:(NSDictionary *)media {
    onMediaLoaded(media);
}

- (void)onSessionUpdated:(NSDictionary *)session isAlive:(BOOL)isAlive {
    onSessionUpdated(session,isAlive);
}

- (void)onSessionEnd:(NSDictionary *)session {
    onSessionEnd(session);
}

- (void)onMessageReceived:(NSDictionary *)session namespace:(NSString *)namespace message:(NSString *)message {
    onMessageReceived(session,namespace,message);
}


@end

@implementation CastRequestDelegate

- (instancetype)initWithSuccess:(void(^)(void))success failure:(void(^)(GCKError*))failure abortion:(void(^)(GCKRequestAbortReason))abortion
{
    self = [super init];
    if (self) {
        didSuccess = success;
        didFail = failure;
        didAbort = abortion;
        finished = false;
    }
    return self;
}

-(void)requestDidComplete:(GCKRequest *)request{
    didSuccess();
    finished = true;
}

-(void)request:(GCKRequest *)request didFailWithError:(GCKError *)error{
    didFail(error);
    finished = true;
}

- (void)request:(GCKRequest *)request didAbortWithReason:(GCKRequestAbortReason)abortReason {
    didAbort(abortReason);
    finished = true;
}
@end
