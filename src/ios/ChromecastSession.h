//
//  ChromecastSession.h
//  ChromeCast
//
//  Created by mac on 2019/9/30.
//

#import <Foundation/Foundation.h>
#import <GoogleCast/GoogleCast.h>
#import <Cordova/CDV.h>
#import "CastRequestDelegate.h"

NS_ASSUME_NONNULL_BEGIN

@interface ChromecastSession : NSObject <GCKSessionManagerListener,GCKRemoteMediaClientListener,GCKGenericChannelDelegate>

@property (nonatomic, retain) id<CDVCommandDelegate> commandDelegate;
@property (nonatomic, retain) CDVInvokedUrlCommand* initialCommand;
@property (nonatomic, retain) GCKCastSession* currentSession;
@property (nonatomic, retain) GCKRemoteMediaClient* remoteMediaClient;
@property (nonatomic, retain) GCKCastContext* castContext;
@property (nonatomic, retain) NSMutableArray<CastRequestDelegate*>* requestDelegates;
@property (nonatomic, retain) id<CastSessionListener> sessionListener;
@property (nonatomic, retain) NSMutableDictionary* genericChannels;
@property (nonatomic, retain) NSString* sessionStatus;

- (instancetype)initWithDevice:(GCKDevice*)device cordovaDelegate:(id<CDVCommandDelegate>)cordovaDelegate initialCommand:(CDVInvokedUrlCommand*)initialCommand;
- (void)add:(id<CastSessionListener>)listener;
- (void)createSession:(GCKDevice*)device;
- (CastRequestDelegate*)createGeneralRequestDelegate:(CDVInvokedUrlCommand*)command;
- (void)setMediaMutedAndVolumeWIthCommand:(CDVInvokedUrlCommand*)command muted:(BOOL)muted nvewLevel:(float)newLevel;
- (void)setMediaMutedWIthCommand:(CDVInvokedUrlCommand*)command muted:(BOOL)muted;
- (void)setMediaVolumeWithCommand:(CDVInvokedUrlCommand*)withCommand newVolumeLevel:(float)newLevel;
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
