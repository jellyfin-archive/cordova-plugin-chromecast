import GoogleCast

@objc(Chromecast) class Chromecast : CDVPlugin {

  @objc(setup:)
  func setup(command: CDVInvokedUrlCommand) {
    // No arguments

    // TODO: Implement
  }

  @objc(getCurrentSession:)
  func getCurrentSession() {
    return GCKCastContext.sharedInstance().sessionManager.currentCastSession
  }

  @objc(initialize:)
  func initialize(command: CDVInvokedUrlCommand) {
    let appId = command.arguments[0] as? String ?? kGCKDefaultMediaReceiverApplicationID

    let criteria = GCKDiscoveryCriteria(applicationID: appId)
    let options = GCKCastOptions(discoveryCriteria: criteria)
    options.physicalVolumeButtonsWillControlDeviceVolume = true

    GCKCastContext.setSharedInstanceWith(options)
  }

  @objc(requestSession:)
  func requestSession(command: CDVInvokedUrlCommand) {
    // No arguments

    // TODO: Implement
  }

  @objc(setReceiverVolumeLevel:)
  func setReceiverVolumeLevel(command: CDVInvokedUrlCommand) {
    let newLevel = command.arguments[0] as? Float ?? 1.0

    var pluginResult = CDVPluginResult(
        status: CDVCommandStatus_ERROR
    )

    var currentSession = self.getCurrentSession()

    if (currentSession != nil) {
      // TODO: Handle GCKRequest
      currentSession!.remoteMediaClient.setStreamVolume(newLevel)

      pluginResult = CDVPluginResult(
        status: CDVCommandStatus_OK
      )
    }

    self.commandDelegate!.send(
      pluginResult,
      callbackId: command.callbackId
    )
  }

  @objc(setReceiverMuted:)
  func setReceiverMuted(command: CDVInvokedUrlCommand) {
    let muted = command.arguments[0] as? Bool ?? false

    //TODO: Implement
  }

  @objc(sessionStop:)
  func sessionStop(command: CDVInvokedUrlCommand) {
    // No arguments

    // TODO: Implement
  }

  @objc(sessionLeave:)
  func sessionLeave(command: CDVInvokedUrlCommand) {
    // No arguments

    // TODO: Implement
  }

  @objc(sendMessage:)
  func sendMessage(command: CDVInvokedUrlCommand) {
    let namespace = command.arguments[0] as? String ?? ""
    let message = command.arguments[1] as? String ?? ""

    // TODO: Implement
  }

  @objc(loadMedia:)
  func loadMedia(command: CDVInvokedUrlCommand) {
    let contentId = command.arguments[0] as? String ?? ""
    let customData = command.arguments[1] as? Any
    let contentType = command.arguments[2] as? String ?? ""
    let duration = command.arguments[3] as? Double ?? 0.0
    let streamType = command.arguments[4] as? String ?? ""
    let autoplay = command.arguments[5] as? Bool ?? true
    let currentTime = command.arguments[6] as? Int ?? 0
    let metadata = command.arguments[7] as? Any
    let textTrackStyle = command.arguments[8] as? Any

    // TODO: Implement
  }

  @objc(addMessageListener:)
  func addMessageListener(command: CDVInvokedUrlCommand) {
    let namespace = command.arguments[0] as? String ?? ""

    // TODO: Implement
  }

  @objc(mediaPlay:)
  func mediaPlay(command: CDVInvokedUrlCommand) {
    // No arguments

    // TODO: Implement
  }

  @objc(mediaPause:)
  func mediaPause(command: CDVInvokedUrlCommand) {
    // No arguments

    // TODO: Implement
  }

  @objc(mediaSeek:)
  func mediaSeek(command: CDVInvokedUrlCommand) {
    let currentTime = command.arguments[0] as? Int ?? 0
    let resumeState = command.arguments[1] as? String ?? ""

    // TODO: Implement
  }

  @objc(mediaStop:)
  func mediaStop(command: CDVInvokedUrlCommand) {
    // No arguments

    // TODO: Implement
  }

  @objc(mediaEditTracksInfo:)
  func mediaEditTracksInfo(command: CDVInvokedUrlCommand) {
    let activeTrackIds = command.arguments[0] as? [Int] ?? [Int]()
    let textTrackStyle = command.arguments[1] as? Any

    // TODO: Implement
  }

  @objc(selectRoute:)
  func selectRoute(command: CDVInvokedUrlCommand) {
    let routeId = command.arguments[0] as? String ?? ""

    // TODO: Implement
  }

  @objc(emitAllRoutes:)
  func emitAllRoutes(command: CDVInvokedUrlCommand) {
    // No arguments

    // TODO: Implement
  }
}
