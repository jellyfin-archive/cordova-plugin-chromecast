import Foundation
import GoogleCast

class CastUtilities {
  static func buildMediaInformation(contentUrl: String, customData: Any, contentType: String, duration: Double, streamType: String, textTrackStyle: Any) -> GCKMediaInformation{
    let url = URL.init(string: contentUrl)

    let mediaInfoBuilder = GCKMediaInformationBuilder.init(contentURL: url)
    mediaInfoBuilder.customData = customData
    mediaInfoBuilder.contentType = contentType
    mediaInfoBuilder.streamDuration = duration.round()

    switch streamType {
    case "buffered":
      mediaInfoBuilder.streamType = GCKMediaStreamType.buffered
    case "live":
      mediaInfoBuilder.streamType = GCKMediaStreamType.live
    default:
      mediaInfoBuilder.streamType = GCKMediaStreamType.none
    }

    mediaInfoBuilder.textTrackStyle = CastUtilities.buildTextTrackStyle(textTrackStyle)


    return mediaInfoBuilder.build()
  }

  static func buildTextTrackStyle(data: Any) -> GCKMediaTextTrackStyle {
    let json = try? JSONSerialization.jsonObject(with: data, options: [])

    let mediaTextTrackStyle = GCKMediaTextTrackStyle.createDefault()

    if let dict = json as? [String: Any] {
      if let bkgColor = dict["backgroundColor"] as? String {
        mediaTextTrackStyle.backgroundColor = GCKColor.init(cssString: bkgColor)
      }

      if let customData = dict["customData"] as? Any {
        mediaTextTrackStyle.customData = customData
      }

      if let edgeColor = dict["edgeColor"] as? String {
        mediaTextTrackStyle.edgeColor = GCKColor.init(cssString: edgeColor)
      }

      if let edgeType = dict["edgeType"] as? String {
        // TODO
      }

      if let fontFamily = dict["fontFamily"] as? String {
        textTrackStyle.fontFamily = fontFamily
      }

      if let fontGenericFamily = dict["fontGenericFamily"] as? String {
        // TODO
      }

      if let fontScale = dict["fontScale"] as? Float {
        textTrackStyle.fontScale = fontScale
      }

      if let fontStyle = dict["fontStyle"] as? String {
        // TODO
      }

      if let foregroundColor = dict["foregroundColor"] as? String {
        mediaTextTrackStyle.foregroundColor = GCKColor.init(cssString: foregroundColor)
      }

      if let windowColor = dict["windowColor"] as? String {
        mediaTextTrackStyle.windowColor = GCKColor.init(cssString: windowColor)
      }

      if let wRoundedCorner = dict["windowRoundedCornerRadius"] as? Float {
        mediaTextTrackStyle.windowRoundedCornerRadius = wRoundedCorner
      }

      if let windowType = dict["windowType"] as? String {
        // TODO
      }

    }

    return mediaTextTrackStyle
  }

}
