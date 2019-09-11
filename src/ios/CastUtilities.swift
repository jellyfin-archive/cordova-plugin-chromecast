import Foundation
import GoogleCast

class CastUtilities {
    static func buildMediaInformation(contentUrl: String, customData: Any, contentType: String, duration: Double, streamType: String, textTrackStyle: Data, metadata: Data) -> GCKMediaInformation{
        let url = URL.init(string: contentUrl)!

        let mediaInfoBuilder = GCKMediaInformationBuilder.init(contentURL: url)
        mediaInfoBuilder.customData = customData
        mediaInfoBuilder.contentType = contentType
        mediaInfoBuilder.streamDuration = Double(duration).rounded()

        switch streamType {
        case "buffered":
            mediaInfoBuilder.streamType = GCKMediaStreamType.buffered
        case "live":
            mediaInfoBuilder.streamType = GCKMediaStreamType.live
        default:
            mediaInfoBuilder.streamType = GCKMediaStreamType.none
        }

        mediaInfoBuilder.textTrackStyle = CastUtilities.buildTextTrackStyle(textTrackStyle)
        mediaInfoBuilder.metadata = CastUtilities.buildMediaMetadata(metadata)


        return mediaInfoBuilder.build()
    }

    static func buildTextTrackStyle(_ data: Data) -> GCKMediaTextTrackStyle? {
        let json = try? JSONSerialization.jsonObject(with: data, options: [])

        let dict = json as? [String: Any] ?? [:]

        if (dict.count != 0) {
            let mediaTextTrackStyle = GCKMediaTextTrackStyle.createDefault()

            if let bkgColor = dict["backgroundColor"] as? String {
                mediaTextTrackStyle.backgroundColor = GCKColor.init(cssString: bkgColor)
            }

            if let customData = dict["customData"] {
                mediaTextTrackStyle.customData = customData
            }

            if let edgeColor = dict["edgeColor"] as? String {
                mediaTextTrackStyle.edgeColor = GCKColor.init(cssString: edgeColor)
            }

            if let edgeType = dict["edgeType"] as? String {
                mediaTextTrackStyle.edgeType = parseEdgeType(edgeType)
            }

            if let fontFamily = dict["fontFamily"] as? String {
                mediaTextTrackStyle.fontFamily = fontFamily
            }

            if let fontGenericFamily = dict["fontGenericFamily"] as? String {
                mediaTextTrackStyle.fontGenericFamily = parseFontGenericFamily(fontGenericFamily)
            }

            if let fontScale = dict["fontScale"] as? Float {
                mediaTextTrackStyle.fontScale = CGFloat(fontScale)
            }

            if let fontStyle = dict["fontStyle"] as? String {
                mediaTextTrackStyle.fontStyle = parseFontStyle(fontStyle)
            }

            if let foregroundColor = dict["foregroundColor"] as? String {
                mediaTextTrackStyle.foregroundColor = GCKColor.init(cssString: foregroundColor)
            }

            if let windowColor = dict["windowColor"] as? String {
                mediaTextTrackStyle.windowColor = GCKColor.init(cssString: windowColor)
            }

            if let wRoundedCorner = dict["windowRoundedCornerRadius"] as? Float {
                mediaTextTrackStyle.windowRoundedCornerRadius = CGFloat(wRoundedCorner)
            }

            if let windowType = dict["windowType"] as? String {
                mediaTextTrackStyle.windowType = parseWindowType(windowType)
            }

            return mediaTextTrackStyle
        } else {
            return nil
        }


    }

    static func buildMediaMetadata(_ data: Data) -> GCKMediaMetadata {
        var mediaMetadata = GCKMediaMetadata(metadataType: GCKMediaMetadataType.generic)

        let json = try? JSONSerialization.jsonObject(with: data, options: [])
        let dict = json as? [String: Any] ?? [:]

        if (dict.count != 0) {
            if let metadataType = dict["metadataType"] as? Int {
                mediaMetadata = GCKMediaMetadata(metadataType: parseMediaMetadataType(metadataType))
            }

            if let title = dict["title"] as? String {
                mediaMetadata.setString(title, forKey: kGCKMetadataKeyTitle)
            }

            if let subtitle = dict["subtitle"] as? String {
                mediaMetadata.setString(subtitle, forKey: kGCKMetadataKeySubtitle)
            }

            if let imagesRaw = dict["images"] as? Data {
                let images = getMetadataImages(imagesRaw)

                images.forEach { (i: GCKImage) in
                    mediaMetadata.addImage(i)
                }
            }
        }

        return mediaMetadata
    }

    static func getMetadataImages(_ imagesRaw: Data) -> [GCKImage] {
        var images = [GCKImage]()
        let json = try? JSONSerialization.jsonObject(with: imagesRaw, options: [])

        if let array = json as? [[String: Any]] {
            array.forEach { (dict: [String : Any]) in
                if let urlString = dict["url"] as? String {
                    let url = URL.init(string: urlString)!
                    let width = dict["width"] as? Int ?? 100
                    let heigth = dict["height"] as? Int ?? 100

                    images.append(GCKImage(url: url, width: width, height: heigth))
                }
            }
        }

        return images
    }

    static func createSessionObject(_ session: GCKCastSession) -> NSDictionary {
        return [
            "appId": session.applicationMetadata?.applicationID ?? "",
            "media": createMediaObject(session) as NSDictionary,
            "appImages": [:] as NSDictionary,
            "sessionId": session.sessionID ?? "",
            "displayName": session.applicationMetadata?.applicationName ?? "",
            "receiver": [
                "friendlyName": session.device.friendlyName ?? "",
                "label": session.device.uniqueID
            ] as NSDictionary,
            "volume": [
                "level": session.currentDeviceVolume,
                "muted": session.currentDeviceMuted
            ] as NSDictionary

        ]
    }

    static func createMediaObject(_ session: GCKCastSession) -> NSDictionary {
        if session.remoteMediaClient == nil {
            return [:]
        }

        let mediaStatus = session.remoteMediaClient?.mediaStatus

        if mediaStatus == nil {
            return [:]
        }

        return [
            "currentItemId": mediaStatus!.currentItemID,
            "currentTime": mediaStatus!.streamPosition,
            "customData": mediaStatus!.customData ?? [:],
            "idleReason": getIdleReason(mediaStatus!.idleReason),
            "loadingItemId": mediaStatus?.loadingItemID ?? 0,
            "media": createMediaInfoObject(mediaStatus!.mediaInformation ?? nil) as NSDictionary,
            "mediaSessionId": mediaStatus!.mediaSessionID,
            "playbackRate": mediaStatus!.playbackRate,
            "playerState": getPlayerState(mediaStatus!.playerState),
            "preloadedItemId": mediaStatus!.preloadedItemID,
            "sessionId": session.sessionID ?? "",
            "volume": [
                "level": mediaStatus!.volume,
                "muted": mediaStatus!.isMuted
            ] as NSDictionary,
            "activeTrackIds": mediaStatus!.activeTrackIDs ?? []
        ]
    }

    static func createMediaInfoObject(_ mediaInfo: GCKMediaInformation?) -> NSDictionary {
        if mediaInfo == nil {
            return [:]
        }

        return [
            "contentId": mediaInfo!.contentID ?? "",
            "contentType": mediaInfo!.contentType,
            "customData": mediaInfo!.customData ?? [:],
            "duration": mediaInfo!.streamDuration,
            "streamType": getStreamType(mediaInfo!.streamType),
            "tracks": getMediaTracks(mediaInfo!.mediaTracks) as NSArray,
            "textTrackSytle": getTextTrackStyle(mediaInfo!.textTrackStyle) as NSDictionary
        ]
    }

    static func getMediaTracks(_ mediaTracks:[GCKMediaTrack]?) -> [NSDictionary] {
        var tracks = [NSDictionary]()

        if mediaTracks == nil {
            return tracks
        }

        for mediaTrack in mediaTracks! {
            let track = [
                "trackId": mediaTrack.identifier,
                "customData": mediaTrack.customData,
                "language": mediaTrack.languageCode,
                "name": mediaTrack.name,
                "subtype": getTextTrackSubtype(mediaTrack.textSubtype),
                "trackContentId": mediaTrack.contentIdentifier,
                "trackContentType": mediaTrack.contentType,
                "type": getTrackType(mediaTrack.type)
            ]

            tracks.append(track as NSDictionary)
        }

        return tracks
    }

    static func getTextTrackStyle(_ textTrackStyle: GCKMediaTextTrackStyle?) -> NSDictionary {
        if textTrackStyle == nil {
            return [:]
        }

        return [
            "backgroundColor": textTrackStyle!.backgroundColor?.cssString(),
            "customData": textTrackStyle!.customData,
            "edgeColor": textTrackStyle!.edgeColor?.cssString(),
            "edgeType": getEdgeType(textTrackStyle!.edgeType),
            "fontFamily": textTrackStyle!.fontFamily,
            "fontGenericFamily": getFontGenericFamily(textTrackStyle!.fontGenericFamily),
            "fontScale": textTrackStyle!.fontScale,
            "fontStyle": getFontStyle(textTrackStyle!.fontStyle),
            "foregroundColor": textTrackStyle!.foregroundColor?.cssString(),
            "windowColor": textTrackStyle!.windowColor?.cssString(),
            "windowRoundedCornerRadius": textTrackStyle!.windowRoundedCornerRadius,
            "windowType": getWindowType(textTrackStyle!.windowType)
        ]
    }

    static func getEdgeType(_ edgeType: GCKMediaTextTrackStyleEdgeType) -> String {
        switch edgeType {
        case GCKMediaTextTrackStyleEdgeType.depressed:
            return "DEPRESSED"
        case GCKMediaTextTrackStyleEdgeType.dropShadow:
            return "DROP_SHADOW"
        case GCKMediaTextTrackStyleEdgeType.outline:
            return "OUTLINE"
        case GCKMediaTextTrackStyleEdgeType.raised:
            return "RAISED"
        default:
            return "NONE"
        }
    }

    static func getFontGenericFamily(_ fontGenericFamily: GCKMediaTextTrackStyleFontGenericFamily) -> String {
        switch fontGenericFamily {
        case GCKMediaTextTrackStyleFontGenericFamily.cursive:
            return "CURSIVE"
        case GCKMediaTextTrackStyleFontGenericFamily.monospacedSansSerif:
            return "MONOSPACED_SANS_SERIF"
        case GCKMediaTextTrackStyleFontGenericFamily.monospacedSerif:
            return "MONOSPACED_SERIF"
        case GCKMediaTextTrackStyleFontGenericFamily.sansSerif:
            return "SANS_SERIF"
        case GCKMediaTextTrackStyleFontGenericFamily.serif:
            return "SERIF"
        case GCKMediaTextTrackStyleFontGenericFamily.smallCapitals:
            return "SMALL_CAPITALS"
        default:
            return "SERIF"
        }
    }

    static func getFontStyle(_ fontStyle: GCKMediaTextTrackStyleFontStyle) -> String {
        switch fontStyle {
        case GCKMediaTextTrackStyleFontStyle.normal:
            return "NORMAL"
        case GCKMediaTextTrackStyleFontStyle.bold:
            return "BOLD"
        case GCKMediaTextTrackStyleFontStyle.boldItalic:
            return "BOLD_ITALIC"
        case GCKMediaTextTrackStyleFontStyle.italic:
            return "ITALIC"
        default:
            return "NORMAL"
        }
    }

    static func getWindowType(_ windowType: GCKMediaTextTrackStyleWindowType) -> String {
        switch windowType {
        case GCKMediaTextTrackStyleWindowType.normal:
            return "NORMAL"
        case GCKMediaTextTrackStyleWindowType.roundedCorners:
            return "ROUNDED_CORNERS"
        default:
            return "NONE"
        }
    }

    static func getTrackType(_ trackType: GCKMediaTrackType) -> String? {
        switch trackType {
        case GCKMediaTrackType.audio:
            return "AUDIO";
        case GCKMediaTrackType.text:
            return "TEXT";
        case GCKMediaTrackType.video:
            return "VIDEO";
        default:
            return nil;
        }
    }

    static func getTextTrackSubtype(_ textSubtype: GCKMediaTextTrackSubtype) -> String? {
        switch textSubtype {
        case GCKMediaTextTrackSubtype.captions:
            return "CAPTIONS";
        case GCKMediaTextTrackSubtype.chapters:
            return "CHAPTERS";
        case GCKMediaTextTrackSubtype.descriptions:
            return "DESCRIPTIONS";
        case GCKMediaTextTrackSubtype.metadata:
            return "METADATA";
        case GCKMediaTextTrackSubtype.subtitles:
            return "SUBTITLES";
        default:
            return nil;
        }
    }

    static func getIdleReason(_ reason: GCKMediaPlayerIdleReason) -> String {
        switch reason {
        case GCKMediaPlayerIdleReason.cancelled:
            return "canceled"
        case GCKMediaPlayerIdleReason.error:
            return "error"
        case GCKMediaPlayerIdleReason.finished:
            return "finished"
        case GCKMediaPlayerIdleReason.interrupted:
            return "interrupted"
        default:
            return "none"
        }
    }

    static func getPlayerState(_ playerState: GCKMediaPlayerState) -> String {
        switch playerState {
        case GCKMediaPlayerState.buffering:
            return "BUFFERING"
        case GCKMediaPlayerState.idle:
            return "IDLE"
        case GCKMediaPlayerState.paused:
            return "PAUSED"
        case GCKMediaPlayerState.playing:
            return "PLAYING"
        default:
            return "UNKNOWN"
        }
    }

    static func getStreamType(_ streamType: GCKMediaStreamType) -> String {
        switch streamType {
        case GCKMediaStreamType.buffered:
            return "buffered";
        case GCKMediaStreamType.live:
            return "live";
        case GCKMediaStreamType.none:
            return "other";
        default:
            return "unknown";
        }
    }

    static func parseEdgeType(_ edgeType: String) -> GCKMediaTextTrackStyleEdgeType {
        switch edgeType {
        case "DEPRESSED":
            return GCKMediaTextTrackStyleEdgeType.depressed
        case "DROP_SHADOW":
            return GCKMediaTextTrackStyleEdgeType.dropShadow
        case "OUTLINE":
            return GCKMediaTextTrackStyleEdgeType.outline
        case "RAISED":
            return GCKMediaTextTrackStyleEdgeType.raised
        default:
            return GCKMediaTextTrackStyleEdgeType.none
        }
    }

    static func parseFontGenericFamily(_ fontGenericFamily: String) -> GCKMediaTextTrackStyleFontGenericFamily {
        switch fontGenericFamily {
        case "CURSIVE":
            return GCKMediaTextTrackStyleFontGenericFamily.cursive
        case "MONOSPACED_SANS_SERIF":
            return GCKMediaTextTrackStyleFontGenericFamily.monospacedSansSerif
        case "MONOSPACED_SERIF":
            return GCKMediaTextTrackStyleFontGenericFamily.monospacedSerif
        case "SANS_SERIF":
            return GCKMediaTextTrackStyleFontGenericFamily.sansSerif
        case "SERIF":
            return GCKMediaTextTrackStyleFontGenericFamily.serif
        case "SMALL_CAPITALS":
            return GCKMediaTextTrackStyleFontGenericFamily.smallCapitals
        default:
            return GCKMediaTextTrackStyleFontGenericFamily.serif
        }
    }

    static func parseFontStyle(_ fontStyle: String) -> GCKMediaTextTrackStyleFontStyle {
        switch fontStyle {
        case "NORMAL":
            return GCKMediaTextTrackStyleFontStyle.normal
        case "BOLD":
            return GCKMediaTextTrackStyleFontStyle.bold
        case "BOLD_ITALIC":
            return GCKMediaTextTrackStyleFontStyle.boldItalic
        case "ITALIC":
            return GCKMediaTextTrackStyleFontStyle.italic
        default:
            return GCKMediaTextTrackStyleFontStyle.normal
        }
    }

    static func parseWindowType(_ windowType: String) -> GCKMediaTextTrackStyleWindowType {
        switch windowType {
        case "NORMAL":
            return GCKMediaTextTrackStyleWindowType.normal
        case "ROUNDED_CORNERS":
            return GCKMediaTextTrackStyleWindowType.roundedCorners
        default:
            return GCKMediaTextTrackStyleWindowType.unknown
        }
    }

    static func parseResumeState(_ resumeState: String) -> GCKMediaResumeState {
        switch resumeState {
        case "PLAYBACK_PAUSE":
            return GCKMediaResumeState.pause
        case "PLAYBACK_START":
            return GCKMediaResumeState.play
        default:
            return GCKMediaResumeState.unchanged
        }
    }

    static func parseMediaMetadataType(_ metadataType: Int) -> GCKMediaMetadataType {
        switch metadataType {
        case 0:
            return GCKMediaMetadataType.generic
        case 1:
            return GCKMediaMetadataType.tvShow
        case 2:
            return GCKMediaMetadataType.movie
        case 3:
            return GCKMediaMetadataType.musicTrack
        case 4:
            return GCKMediaMetadataType.photo
        default:
            return GCKMediaMetadataType.generic
        }
    }

    static func convertDictToJsonString(_ dict: NSDictionary) -> String {
        let json = try? JSONSerialization.data(withJSONObject: dict, options: JSONSerialization.WritingOptions.prettyPrinted)

        return String(data: json ?? Data(), encoding: String.Encoding.utf8) ?? ""
    }

}
