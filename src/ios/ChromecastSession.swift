import GoogleCast

@objc (ChromecastSession) class ChromecastSession {
  var commandDelegate: CDVCommandDelegate?
  var command: CDVInvokedUrlCommand?
  var currentSession: GCKCastSession?
  var remoteMediaClient: GCKRemoteMediaClient

  init(cordovaDelegate: CDVCommandDelegate, cordovaCommand: CDVInvokedUrlCommand) {
    self.commandDelegate = cordovaDelegate
    self.command = cordovaCommand
    self.currentSession = GCKCastContext.sharedInstance().sessionManager?.currentCastSession?
    self.remoteMediaClient = self.currentSession?.remoteMediaClient?
  }

  func setReceiverVolumeLevel(newLevel: Float) {
    request = remoteMediaClient?.setStreamVolume(newLevel)
    request?.delegate = self
  }

  func setReceiverMuted(muted: Bool) {
    request = remoteMediaClient?.setStreamMuted(muted)
    request?.delegate = self
  }

  func loadMedia(mediaInfo: GCKMediaInformation, autoPlay: Bool, currentTime: Double) {
    request = remoteMediaClient?.loadMedia(mediaInfo, autoplay: autoPlay, playPosition: currentTime)
    request?.delegate = self
  }

  func mediaPlay() {
    request = remoteMediaClient?.play()
    request?.delegate = self
  }

  func mediaPause() {
    request = remoteMediaClient?.pause()
    request?.delegate = self
  }

  func mediaStop() {
    request = remoteMediaClient?.stop()
    request?.delegate = self
  }

  func setActiveTracks(activeTrackIds: [Int]) {
    request = remoteMediaClient?.setActiveTrackIDs(activeTrackIds)
    request?.delegate = self
  }


  // Methods from GCKRequestDelegate
  extension ChromecastSession : GCKRequestDelegate {
    func requestDidComplete(_ request: GCKRequest) {
      var pluginResult = CDVPluginResult(
          status: CDVCommandStatus_OK
          messageAs: Int(request.requestId)
      )

      self.commandDelegate!.send(
        pluginResult,
        callbackId: command.callbackId
      )
    }

    func request(_ request: GCKRequest, didFailWithError error: GCKError) {
      var pluginResult = CDVPluginResult(
          status: CDVCommandStatus_ERROR
          messageAs: error
      )

      self.commandDelegate!.send(
        pluginResult,
        callbackId: command.callbackId
      )
    }

    func request(_ request: GCKRequest, didAbortWithReason abortReason: GCKRequestAbortReason) {
      var pluginResult = CDVPluginResult(
          status: CDVCommandStatus_ERROR
          messageAs: abortReason
      )

      self.commandDelegate!.send(
        pluginResult,
        callbackId: command.callbackId
      )
    }
  }
}
