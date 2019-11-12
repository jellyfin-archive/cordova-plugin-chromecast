//
//  CastRequestDelegate.h
//  ChromeCast
//
//  Created by mac on 2019/9/30.
//

#import <Foundation/Foundation.h>
#import <GoogleCast/GoogleCast.h>
#import <GoogleCast/GCKCommon.h>
NS_ASSUME_NONNULL_BEGIN

@protocol  CastSessionListener<NSObject>

-(void)onMediaLoaded:(NSDictionary*)media;
-(void)onMediaUpdated:(NSDictionary*)media isAlive:(BOOL)isAlive;
-(void)onSessionUpdated:(NSDictionary*)session isAlive:(BOOL)isAlive;
-(void)onSessionEnd:(NSDictionary*)session;
-(void)onMessageReceived:(NSDictionary*)session namespace:(NSString*)namespace message:(NSString*)message;
@end

@interface CastConnectionListener : NSObject<CastSessionListener>
{
    void (^onMediaLoaded)(NSDictionary* media);
    void (^onMediaUpdated)(NSDictionary* media,BOOL isAlive);
    void (^onSessionUpdated)(NSDictionary* session, BOOL isAlive);
    void (^onSessionEnd)(NSDictionary* session);
    void (^onMessageReceived)(NSDictionary* session,NSString* namespace,NSString* message);
}

@property (nonatomic, copy) void (^onReceiverAvailableUpdate)(BOOL available);
@property (nonatomic, copy) void (^onSessionRejoin)(NSDictionary* session);

- (instancetype)initWithReceiverAvailableUpdate:(void(^)(BOOL available))onReceiverAvailableUpdate onSessionRejoin:(void(^)(NSDictionary* session))onSessionRejoin onMediaLoaded:(void(^)(NSDictionary* media))onMediaLoaded onMediaUpdated:(void(^)(NSDictionary* media, BOOL isAlive))onMediaUpdated onSessionUpdated:(void(^)(NSDictionary* session, BOOL isAlive))onSessionUpdated onSessionEnd:(void(^)(NSDictionary* session))onSessionEnd onMessageReceived:(void(^)(NSDictionary* session,NSString* namespace,NSString* message))onMessageReceived  ;
@end

@interface CastRequestDelegate : NSObject<GCKRequestDelegate>
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
