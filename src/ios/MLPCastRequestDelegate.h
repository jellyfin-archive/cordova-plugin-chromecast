//
//  MLPCastRequestDelegate.h
//  ChromeCast

#import <Foundation/Foundation.h>
#import <GoogleCast/GoogleCast.h>
#import <GoogleCast/GCKCommon.h>
NS_ASSUME_NONNULL_BEGIN

@protocol  CastSessionListener<NSObject>

-(void)onSessionRejoin:(NSDictionary*)session;
-(void)onMediaLoaded:(NSDictionary*)media;
-(void)onMediaUpdated:(NSDictionary*)media;
-(void)onSessionUpdated:(NSDictionary*)session;
-(void)onSessionEnd:(NSDictionary*)session;
-(void)onMessageReceived:(NSDictionary*)session namespace:(NSString*)namespace message:(NSString*)message;
@end

@interface CastConnectionListener : NSObject<CastSessionListener>
{
    void (^onSessionRejoin)(NSDictionary* session);
    void (^onMediaLoaded)(NSDictionary* media);
    void (^onMediaUpdated)(NSDictionary* media);
    void (^onSessionUpdated)(NSDictionary* session);
    void (^onSessionEnd)(NSDictionary* session);
    void (^onMessageReceived)(NSDictionary* session,NSString* namespace,NSString* message);
}

@property (nonatomic, copy) void (^onReceiverAvailableUpdate)(BOOL available);
//@property (nonatomic, copy) void (^onSessionRejoin)(NSDictionary* session);

- (instancetype)initWithReceiverAvailableUpdate:(void(^)(BOOL available))onReceiverAvailableUpdate onSessionRejoin:(void(^)(NSDictionary* session))onSessionRejoin onMediaLoaded:(void(^)(NSDictionary* m))onMediaLoaded onMediaUpdated:(void(^)(NSDictionary* media))onMediaUpdated onSessionUpdated:(void(^)(NSDictionary* session))onSessionUpdated onSessionEnd:(void(^)(NSDictionary* session))onSessionEnd onMessageReceived:(void(^)(NSDictionary* session,NSString* namespace,NSString* message))onMessageReceived  ;
@end

@interface MLPCastRequestDelegate : NSObject<GCKRequestDelegate>
{
    void (^didSuccess)(void);
    void (^didFail)(GCKError*);
    void (^didAbort)(GCKRequestAbortReason);
    BOOL finished;
}

@property (nonatomic,assign) BOOL finished;

- (instancetype)initWithSuccess:(void(^)(void))success failure:(void(^)(GCKError*))failure abortion:(void(^)(GCKRequestAbortReason))abortion;

@end

NS_ASSUME_NONNULL_END
