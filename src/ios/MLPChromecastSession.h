//
//  MLPChromecastSession.h
//  ChromeCast

#import <Foundation/Foundation.h>
#import <GoogleCast/GoogleCast.h>
#import <Cordova/CDV.h>
#import "MLPCastRequestDelegate.h"

NS_ASSUME_NONNULL_BEGIN

@interface MLPChromecastSession : NSObject <GCKSessionManagerListener,GCKRemoteMediaClientListener,GCKGenericChannelDelegate>

@property (nonatomic, retain) id<CDVCommandDelegate> commandDelegate;
@property (nonatomic, retain) GCKSessionManager* sessionManager;
@property (nonatomic, retain) GCKRemoteMediaClient* remoteMediaClient;
@property (nonatomic, retain) GCKCastContext* castContext;
@property (nonatomic, retain) id<CastSessionListener> sessionListener;
@property (nonatomic, retain) NSMutableDictionary* genericChannels;

- (instancetype)initWithListener:(id<CastSessionListener>)listener cordovaDelegate:(id<CDVCommandDelegate>)cordovaDelegate;
- (void)tryRejoin;
- (void)joinDevice:(GCKDevice*)device cdvCommand:(CDVInvokedUrlCommand*)command;
- (void)endSession:(CDVInvokedUrlCommand*)command killSession:(BOOL)killSession;
- (void)endSessionWithCallback:(void(^)(void))callback killSession:(BOOL)killSession;
- (void)setMediaMutedAndVolumeWithCommand:(CDVInvokedUrlCommand*)command;
- (void)setReceiverVolumeLevelWithCommand:(CDVInvokedUrlCommand*)withCommand newLevel:(float)newLevel;
- (void)setReceiverMutedWithCommand:(CDVInvokedUrlCommand*)command muted:(BOOL)muted;
- (void)loadMediaWithCommand:(CDVInvokedUrlCommand*)command mediaInfo:(GCKMediaInformation*)mediaInfo autoPlay:(BOOL)autoPlay currentTime : (double)currentTime;
- (void)createMessageChannelWithCommand:(CDVInvokedUrlCommand*)command namespace:(NSString*)namespace;
- (void)sendMessageWithCommand:(CDVInvokedUrlCommand*)command namespace:(NSString*)namespace message:(NSString*)message;
- (void)mediaSeekWithCommand:(CDVInvokedUrlCommand*)command position:(NSTimeInterval)position resumeState:(GCKMediaResumeState)resumeState;
- (void)mediaPlayWithCommand:(CDVInvokedUrlCommand*)command;
- (void)mediaPauseWithCommand:(CDVInvokedUrlCommand*)command;
- (void)mediaStopWithCommand:(CDVInvokedUrlCommand*)command;
- (void)setActiveTracksWithCommand:(CDVInvokedUrlCommand*)command activeTrackIds:(NSArray<NSNumber*>*)activeTrackIds textTrackStyle:(GCKMediaTextTrackStyle*)textTrackStyle;
- (void)queueLoadItemsWithCommand:(CDVInvokedUrlCommand *)command queueItems:(NSArray *)queueItems startIndex:(NSInteger)startIndex repeatMode:(GCKMediaRepeatMode)repeatMode;
- (void)queueJumpToItemWithCommand:(CDVInvokedUrlCommand *)command itemId:(NSUInteger)itemId;
- (void) checkFinishDelegates;
@end

NS_ASSUME_NONNULL_END
