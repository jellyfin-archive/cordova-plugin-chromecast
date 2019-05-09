import GoogleCast

@objc(Chromecast) class Chromecast : CDVPlugin {
  var devicesAvailable: [GCKDevice] = []

//  func sendJavascript(jsCommand: String) {
////    self.webView.evaluateJavaScript(jsCommand)
//  }
//
//  func log(s: String) {
//    self.sendJavascript(jsCommand: "console.log(\"\(s)\")")
//  }

  @objc(setup:)
  func setup(command: CDVInvokedUrlCommand) {
    // No arguments

    let pluginResult = CDVPluginResult(
        status: CDVCommandStatus_OK
    )

    self.commandDelegate!.send(
        pluginResult,
        callbackId: command.callbackId
    )
  }

  @objc(initialize:)
  func initialize(command: CDVInvokedUrlCommand) {
    self.devicesAvailable = [GCKDevice]()

    let appId = command.arguments[0] as? String ?? kGCKDefaultMediaReceiverApplicationID

    let criteria = GCKDiscoveryCriteria(applicationID: appId)
    let options = GCKCastOptions(discoveryCriteria: criteria)
    options.physicalVolumeButtonsWillControlDeviceVolume = true

    GCKCastContext.setSharedInstanceWith(options)

    GCKCastContext.sharedInstance().discoveryManager.add(self)

    // For debugging purpose
    GCKLogger.sharedInstance().delegate = self
  }

  @objc(requestSession:)
  func requestSession(command: CDVInvokedUrlCommand) {
    // No arguments
    let alert  = UIAlertController(title: "Cast to", message: nil, preferredStyle: .alert)

    for device in self.devicesAvailable {
      alert.addAction(
        UIAlertAction(title: device.friendlyName , style: UIAlertAction.Style.default, handler: {(_) in
            print(device.friendlyName ?? "" + "(" + device.uniqueID ?? "" + ")")
        })
      )
    }

    alert.addAction(
        UIAlertAction(title: "Cancel", style: UIAlertAction.Style.destructive, handler: nil)
    )

    self.viewController?.present(alert, animated: true, completion: nil)
  }

  @objc(setReceiverVolumeLevel:)
  func setReceiverVolumeLevel(command: CDVInvokedUrlCommand) {
    let newLevel = command.arguments[0] as? Float ?? 1.0

    let session = ChromecastSession(cordovaDelegate: self.commandDelegate, cordovaCommand: command)
    session.setReceiverVolumeLevel(newLevel: newLevel)
  }

  @objc(setReceiverMuted:)
  func setReceiverMuted(command: CDVInvokedUrlCommand) {
    let muted = command.arguments[0] as? Bool ?? false

    let session = ChromecastSession(cordovaDelegate: self.commandDelegate, cordovaCommand: command)
    session.setReceiverMuted(muted: muted)
  }

  @objc(sessionStop:)
  func sessionStop(command: CDVInvokedUrlCommand) {
    // No arguments

    let result = GCKCastContext.sharedInstance().sessionManager.endSessionAndStopCasting(true)

    let pluginResult = CDVPluginResult(
        status: CDVCommandStatus_OK,
        messageAs: result
    )

    self.commandDelegate!.send(
      pluginResult,
      callbackId: command.callbackId
    )
  }

  @objc(sessionLeave:)
  func sessionLeave(command: CDVInvokedUrlCommand) {
    // No arguments

    let result = GCKCastContext.sharedInstance().sessionManager.endSession()

    let pluginResult = CDVPluginResult(
        status: CDVCommandStatus_OK,
        messageAs: result
    )

    self.commandDelegate!.send(
      pluginResult,
      callbackId: command.callbackId
    )
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
    let customData = command.arguments[1]
    let contentType = command.arguments[2] as? String ?? ""
    let duration = command.arguments[3] as? Double ?? 0.0
    let streamType = command.arguments[4] as? String ?? ""
    let autoplay = command.arguments[5] as? Bool ?? true
    let currentTime = command.arguments[6] as? Double ?? 0
    let metadata = command.arguments[7]
    let textTrackStyle = command.arguments[8] as? Data ?? Data()

    let mediaInfo = CastUtilities.buildMediaInformation(contentUrl: contentId, customData: customData, contentType: contentType, duration: duration, streamType: streamType, textTrackStyle: textTrackStyle)

    let session = ChromecastSession(cordovaDelegate: self.commandDelegate, cordovaCommand: command)
    session.loadMedia(mediaInfo, autoplay, currentTime)
  }

  @objc(addMessageListener:)
  func addMessageListener(command: CDVInvokedUrlCommand) {
    let namespace = command.arguments[0] as? String ?? ""

    // TODO: Implement
  }

  @objc(mediaPlay:)
  func mediaPlay(command: CDVInvokedUrlCommand) {
    // No arguments

    let session = ChromecastSession(cordovaDelegate: self.commandDelegate, cordovaCommand: command)
    session.mediaPlay()
  }

  @objc(mediaPause:)
  func mediaPause(command: CDVInvokedUrlCommand) {
    // No arguments

    let session = ChromecastSession(cordovaDelegate: self.commandDelegate, cordovaCommand: command)
    session.mediaPause()
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

    let session = ChromecastSession(cordovaDelegate: self.commandDelegate, cordovaCommand: command)
    session.mediaStop()
  }

  @objc(mediaEditTracksInfo:)
  func mediaEditTracksInfo(command: CDVInvokedUrlCommand) {
    let activeTrackIds = command.arguments[0] as? [NSNumber] ?? [NSNumber]()
    let textTrackStyle = command.arguments[1]

    let session = ChromecastSession(cordovaDelegate: self.commandDelegate, cordovaCommand: command)
    session.setActiveTracks(activeTrackIds: activeTrackIds)
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

extension Chromecast: GCKLoggerDelegate {
    func logMessage(_ message: String, at level: GCKLoggerLevel, fromFunction function: String, location: String) {
        print("Message from Chromecast = \(message)")
    }
}

extension Chromecast : GCKDiscoveryManagerListener {
    func didInsertDevice(_ device: GCKDevice, atIndex: Int) {
        self.devicesAvailable.insert(device, at: atIndex)
    }

    func didUpdateDevice(_ device: GCKDevice, atIndex: Int) {
        self.devicesAvailable.remove(at: atIndex)
        self.devicesAvailable.insert(device, at: atIndex)
    }

    func didRemoveDevice(_ device: GCKDevice, atIndex: Int) {
        self.devicesAvailable.remove(at: atIndex)
    }
}
