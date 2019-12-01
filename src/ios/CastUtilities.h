//
//  CastUtilities.h
//  ChromeCast
//
//  Created by mac on 2019/9/30.
//

#import <Foundation/Foundation.h>
#import <GoogleCast/GoogleCast.h>

NS_ASSUME_NONNULL_BEGIN

@interface CastUtilities : NSObject

+ (GCKMediaInformation *)buildMediaInformation:(NSString *)contentUrl customData:(id )customData contentType:(NSString *)contentType duration:(double)duration streamType:(NSString *)streamType textTrackStyle:(NSDictionary *)textTrackStyle metaData:(NSDictionary *)metaData;

+ (GCKMediaTextTrackStyle *)buildTextTrackStyle:(NSDictionary *)data;
+(GCKMediaMetadata*)buildMediaMetadata:(NSDictionary*)data;
+(NSArray<GCKImage*>*)getMetadataImages:(NSData*)imagesRaw;
+ (NSDictionary*)createSessionObject:(GCKCastSession *)session;
+ (NSDictionary*)createSessionObject:(GCKCastSession *)session status:(NSString*)status;
+(NSDictionary*)createMediaObject:(GCKCastSession*)session;
+(NSDictionary*)createMediaInfoObject:(GCKMediaInformation*)mediaInfo;
+(NSArray*)createDeviceArray;
+(NSArray<NSDictionary*>*)getMediaTracks:(NSArray<GCKMediaTrack*>*)mediaTracks;
+(NSDictionary*)getTextTrackStyle:(GCKMediaTextTrackStyle*)textTrackStyle;
+(NSString*)getEdgeType:(GCKMediaTextTrackStyleEdgeType)edgeType;
+(NSString*)getFontGenericFamily:(GCKMediaTextTrackStyleFontGenericFamily)fontGenericFamily;
+(NSString*)getFontStyle:(GCKMediaTextTrackStyleFontStyle)fontStyle;
+(NSString*)getWindowType:(GCKMediaTextTrackStyleWindowType)windowType;
+(NSString*)getTrackType:(GCKMediaTrackType)trackType;
+(NSString*)getTextTrackSubtype:(GCKMediaTextTrackSubtype)textSubtype;
+(NSString*)getIdleReason:(GCKMediaPlayerIdleReason)reason;
+(NSString*)getPlayerState:(GCKMediaPlayerState)playerState;
+(NSString*)getStreamType:(GCKMediaStreamType)streamType;
+(GCKMediaTextTrackStyleEdgeType)parseEdgeType:(NSString*)edgeType;
+(GCKMediaTextTrackStyleFontGenericFamily)parseFontGenericFamily:(NSString*)fontGenericFamily;
+(GCKMediaTextTrackStyleFontStyle)parseFontStyle:(NSString*)fontStyle;
+(GCKMediaTextTrackStyleWindowType)parseWindowType:(NSString*)windowType;
+(GCKMediaResumeState)parseResumeState:(NSString*)resumeState;
+(GCKMediaMetadataType)parseMediaMetadataType:(NSInteger)metadataType;
+(NSString*)convertDictToJsonString:(NSDictionary*)dict;
+ (NSDictionary*)createError:(NSString*)code message:(NSString*)message;
+ (GCKMediaInformation *)buildMediaInformationForQueueItem:(NSString *)contentUrl customData:(id )customData contentType:(NSString *)contentType duration:(double)duration startTime:(double)startTime streamType:(NSString *)streamType  metaData:(NSDictionary *)metaData;
@end

NS_ASSUME_NONNULL_END
