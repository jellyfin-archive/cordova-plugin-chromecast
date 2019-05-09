import GoogleCast

@objc (ChromecastSession) class ChromecastSession : NSObject {
  var commandDelegate: CDVCommandDelegate?
  var command: CDVInvokedUrlCommand?
  var currentSession: GCKCastSession?
  var remoteMediaClient: GCKRemoteMediaClient?

  init(cordovaDelegate: CDVCommandDelegate, cordovaCommand: CDVInvokedUrlCommand) {
    self.commandDelegate = cordovaDelegate
    self.command = cordovaCommand
    self.currentSession = GCKCastContext.sharedInstance().sessionManager.currentCastSession
    self.remoteMediaClient = (self.currentSession?.remoteMediaClient)
  }

  func setReceiverVolumeLevel(newLevel: Float) {
    let request = remoteMediaClient?.setStreamVolume(newLevel)
    request?.delegate = self
  }

  func setReceiverMuted(muted: Bool) {
    let request = remoteMediaClient?.setStreamMuted(muted)
    request?.delegate = self
  }

  func loadMedia(_ mediaInfo: GCKMediaInformation, _ autoPlay: Bool, _ currentTime: Double) {
    let request = remoteMediaClient?.loadMedia(mediaInfo, autoplay: autoPlay, playPosition: currentTime)
    request?.delegate = self
  }

  func mediaPlay() {
    let request = remoteMediaClient?.play()
    request?.delegate = self
  }

  func mediaPause() {
    let request = remoteMediaClient?.pause()
    request?.delegate = self
  }

  func mediaStop() {
    let request = remoteMediaClient?.stop()
    request?.delegate = self
  }

  func setActiveTracks(activeTrackIds: [NSNumber]) {
    let request = remoteMediaClient?.setActiveTrackIDs(activeTrackIds)
    request?.delegate = self
  }
}

// Methods from GCKRequestDelegate
extension ChromecastSession : GCKRequestDelegate {
  func requestDidComplete(_ request: GCKRequest) {
    let pluginResult = CDVPluginResult(
        status: CDVCommandStatus_OK,
        messageAs: Int(request.requestID)
    )

    self.commandDelegate!.send(
      pluginResult,
      callbackId: command?.callbackId
    )
  }

  func request(_ request: GCKRequest, didFailWithError error: GCKError) {
    let pluginResult = CDVPluginResult(
        status: CDVCommandStatus_ERROR,
        messageAs: "Error"
    )

    self.commandDelegate!.send(
      pluginResult,
      callbackId: command?.callbackId
    )
  }

    func request(_ request: GCKRequest, didAbortWith abortReason: GCKRequestAbortReason) {
        let pluginResult = CDVPluginResult(
        status: CDVCommandStatus_ERROR,
        messageAs: abortReason.rawValue
    )

    self.commandDelegate!.send(
      pluginResult,
      callbackId: command?.callbackId
    )
  }
}
