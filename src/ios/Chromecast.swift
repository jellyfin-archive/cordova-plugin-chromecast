import GoogleCast

@objc(Chromecast) class Chromecast : CDVPlugin {
  var devicesAvailable: [GCKDevice] = []
    var currentSession: ChromecastSession?

  func sendJavascript(jsCommand: String) {
    self.webViewEngine.evaluateJavaScript(jsCommand, completionHandler: nil)
  }

  func log(_ s: String) {
    self.sendJavascript(jsCommand: "console.log(\">>Chromecast-iOS: \(s)\")")
  }

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

  @objc(emitAllRoutes:)
  func emitAllRoutes(command: CDVInvokedUrlCommand) {
    // No arguments. It's only implemented to satisfy plugin's JS API.

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
    options.disableDiscoveryAutostart = false
    GCKCastContext.setSharedInstanceWith(options)

    GCKCastContext.sharedInstance().discoveryManager.add(self)

    // For debugging purpose
    GCKLogger.sharedInstance().delegate = self

    self.log("API Initialized with appID \(appId)")

    self.checkReceiverAvailable()

    let pluginResult = CDVPluginResult(
        status: CDVCommandStatus_OK
    )

    self.commandDelegate!.send(
        pluginResult,
        callbackId: command.callbackId
    )
  }

  func checkReceiverAvailable() {
    let sessionManager = GCKCastContext.sharedInstance().sessionManager

    if self.devicesAvailable.count > 0 || (sessionManager.currentSession != nil) {
        self.sendJavascript(jsCommand: "chrome.cast._.receiverAvailable()")
    } else {
        self.sendJavascript(jsCommand: "chrome.cast._.receiverUnavailable()")
    }

  }

  @objc(requestSession:)
  func requestSession(command: CDVInvokedUrlCommand) {
    let alert  = UIAlertController(title: "Cast to", message: nil, preferredStyle: .actionSheet)

    for device in self.devicesAvailable {
      alert.addAction(
        UIAlertAction(title: device.friendlyName , style: UIAlertAction.Style.default, handler: {(_) in
            self.currentSession = ChromecastSession(device, cordovaDelegate: self.commandDelegate, initialCommand: command)
            self.currentSession?.add(self)
        })
      )
    }

    alert.addAction(
        UIAlertAction(title: "Cancel", style: UIAlertAction.Style.cancel, handler: {(_) in
          let pluginResult = CDVPluginResult(
              status: CDVCommandStatus_ERROR,
              messageAs: "cancel"
          )

          self.commandDelegate!.send(
              pluginResult,
              callbackId: command.callbackId
          )
        })
    )

    self.viewController?.present(alert, animated: true, completion: nil)
  }

  @objc(setMediaVolume:)
  func setMediaVolume(command: CDVInvokedUrlCommand) {
    let newLevel = command.arguments[0] as? Double ?? 1.0

    self.currentSession?.setReceiverVolumeLevel(command, newLevel: Float(newLevel))
  }

  @objc(setMediaMuted:)
  func setMediaMuted(command: CDVInvokedUrlCommand) {
    let muted = command.arguments[0] as? Bool ?? false

    self.currentSession?.setReceiverMuted(command, muted: muted)
  }

  @objc(sessionStop:)
  func sessionStop(command: CDVInvokedUrlCommand) {
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

  @objc(loadMedia:)
  func loadMedia(command: CDVInvokedUrlCommand) {
    let contentId = command.arguments[0] as? String ?? ""
    let customData = command.arguments[1]
    let contentType = command.arguments[2] as? String ?? ""
    let duration = command.arguments[3] as? Double ?? 0.0
    let streamType = command.arguments[4] as? String ?? ""
    let autoplay = command.arguments[5] as? Bool ?? true
    let currentTime = command.arguments[6] as? Double ?? 0
    let metadata = (try? JSONSerialization.data(withJSONObject: command.arguments[7], options: [])) ?? Data()
    let textTrackStyle = (try? JSONSerialization.data(withJSONObject: command.arguments[8], options: [])) ?? Data()

    let mediaInfo = CastUtilities.buildMediaInformation(contentUrl: contentId, customData: customData, contentType: contentType, duration: duration, streamType: streamType, textTrackStyle: textTrackStyle, metadata: metadata)

    self.currentSession?.loadMedia(command, mediaInfo: mediaInfo, autoPlay: autoplay, currentTime: currentTime)
  }

  @objc(addMessageListener:)
  func addMessageListener(command: CDVInvokedUrlCommand) {
    let namespace = command.arguments[0] as? String ?? ""

    self.currentSession?.createMessageChannel(command, namespace: namespace)
  }

  @objc(sendMessage:)
  func sendMessage(command: CDVInvokedUrlCommand) {
    let namespace = command.arguments[0] as? String ?? ""
    let message = command.arguments[1] as? String ?? ""

    self.currentSession?.sendMessage(command, namespace: namespace, message: message)
  }

  @objc(mediaPlay:)
  func mediaPlay(command: CDVInvokedUrlCommand) {
    self.currentSession?.mediaPlay(command)
  }

  @objc(mediaPause:)
  func mediaPause(command: CDVInvokedUrlCommand) {
    self.currentSession?.mediaPause(command)
  }

  @objc(mediaSeek:)
  func mediaSeek(command: CDVInvokedUrlCommand) {
    let currentTime = command.arguments[0] as? Int ?? 0
    let resumeState = command.arguments[1] as? String ?? ""

    let resumeStateObj = CastUtilities.parseResumeState(resumeState)

    self.currentSession?.mediaSeek(command, position: TimeInterval(currentTime), resumeState: resumeStateObj)
  }

  @objc(mediaStop:)
  func mediaStop(command: CDVInvokedUrlCommand) {
    self.currentSession?.mediaStop(command)
  }

  @objc(mediaEditTracksInfo:)
  func mediaEditTracksInfo(command: CDVInvokedUrlCommand) {
    let activeTrackIds = command.arguments[0] as? [NSNumber] ?? [NSNumber]()
    let textTrackStyle = (try? JSONSerialization.data(withJSONObject: command.arguments[1], options: [])) ?? Data()

    let textTrackStyleObject = CastUtilities.buildTextTrackStyle(textTrackStyle)
    self.currentSession?.setActiveTracks(command, activeTrackIds: activeTrackIds, textTrackStyle: textTrackStyleObject)
  }

  @objc(selectRoute:)
  func selectRoute(command: CDVInvokedUrlCommand) {
    let routeID = command.arguments[0] as? String ?? ""

    let device = GCKCastContext.sharedInstance().discoveryManager.device(withUniqueID: routeID)

    if device != nil {
        self.currentSession = ChromecastSession(device!, cordovaDelegate: self.commandDelegate, initialCommand: command)
        self.currentSession?.add(self)
    } else {
        let pluginResult = CDVPluginResult(
            status: CDVCommandStatus_ERROR,
            messageAs: "selectRoute: Invalid Device ID"
        )
        self.commandDelegate!.send(pluginResult, callbackId: command.callbackId)
    }
  }
}

extension Chromecast: GCKLoggerDelegate {
    func logMessage(_ message: String, at level: GCKLoggerLevel, fromFunction function: String, location: String) {
        self.log("GCKLogger = \(message), \(level), \(function), \(location)")
    }
}

extension Chromecast : GCKDiscoveryManagerListener {
    private func deviceToJson(_ device: GCKDevice) -> String {
        let deviceJson = ["name": device.friendlyName ?? device.deviceID, "id": device.uniqueID] as NSDictionary

        return CastUtilities.convertDictToJsonString(deviceJson)
    }

    func didInsert(_ device: GCKDevice, at index: UInt) {
        self.log("Device discovered = \(device.friendlyName ?? device.deviceID)")
        self.devicesAvailable.insert(device, at: Int(index))

        self.checkReceiverAvailable()

        // Notify JS API of new available device
        self.sendJavascript(jsCommand: "chrome.cast._.routeAdded(\(self.deviceToJson(device)));")
    }

    func didUpdate(_ device: GCKDevice, at index: UInt, andMoveTo newIndex: UInt) {
        self.devicesAvailable.remove(at: Int(index))
        self.devicesAvailable.insert(device, at: Int(newIndex))

        self.checkReceiverAvailable()
    }

    func didRemove(_ device: GCKDevice, at index: UInt) {
        self.devicesAvailable.remove(at: Int(index))

        self.checkReceiverAvailable()

        // Notify JS API of new unavailable device
        self.sendJavascript(jsCommand: "chrome.cast._.routeRemoved(\(self.deviceToJson(device)));")
    }
}

extension Chromecast : CastSessionListener {
    func onMediaLoaded(_ media: NSDictionary) {
        self.sendJavascript(jsCommand: "chrome.cast._.mediaLoaded(true, \(CastUtilities.convertDictToJsonString(media)));")
    }

    func onMediaUpdated(_ media: NSDictionary, isAlive: Bool) {
        if isAlive {
            self.sendJavascript(jsCommand: "chrome.cast._.mediaUpdated(true, \(CastUtilities.convertDictToJsonString(media)));")
        } else {
            self.sendJavascript(jsCommand: "chrome.cast._.mediaUpdated(false, \(CastUtilities.convertDictToJsonString(media)));")
        }
    }

    func onSessionUpdated(_ session: NSDictionary, isAlive: Bool) {
        if isAlive {
            self.sendJavascript(jsCommand: "chrome.cast._.sessionUpdated(true, \(CastUtilities.convertDictToJsonString(session)));")
        } else {
            self.log("SESSION DESTROY!")
            self.sendJavascript(jsCommand: "chrome.cast._.sessionUpdated(false, \(CastUtilities.convertDictToJsonString(session)));")
            self.currentSession = nil
        }
    }

    func onMessageReceived(_ session: NSDictionary, namespace: String, message: String) {
        let sessionId = session.value(forKey: "sessionId") as? String ?? ""
        let messageFormatted = message.replacingOccurrences(of: "\\", with: "\\\\")

        sendJavascript(jsCommand: "chrome.cast._.onMessage('\(sessionId)', '\(namespace)', '\(messageFormatted)');")
    }
}
