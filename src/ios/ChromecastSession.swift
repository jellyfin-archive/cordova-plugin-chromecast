import GoogleCast

@objc (ChromecastSession) class ChromecastSession : NSObject {
    var commandDelegate: CDVCommandDelegate?
    var initialCommand: CDVInvokedUrlCommand?
    var currentSession: GCKCastSession?
    var remoteMediaClient: GCKRemoteMediaClient?
    var castContext: GCKCastContext?
    var requestDelegates: [CastRequestDelegate] = []
    var sessionListener: CastSessionListener?
    var genericChannels: [String : GCKGenericChannel] = [:]

    init(_ withDevice: GCKDevice, cordovaDelegate: CDVCommandDelegate, initialCommand: CDVInvokedUrlCommand) {
        super.init()
        self.commandDelegate = cordovaDelegate
        self.initialCommand = initialCommand

        self.castContext = GCKCastContext.sharedInstance()
        self.castContext?.sessionManager.add(self)

        self.createSession(withDevice)
    }

    func add(_ listener: CastSessionListener) {
        self.sessionListener = listener
    }

    func createSession(_ device: GCKDevice?) {
        if device != nil {
            castContext?.sessionManager.startSession(with: device!)
        } else {
            let pluginResult = CDVPluginResult(
                status: CDVCommandStatus_ERROR,
                messageAs: "Cannot connect to selected cast device."
            )

            self.commandDelegate!.send(pluginResult, callbackId: self.initialCommand?.callbackId)
        }
    }

    func createGeneralRequestDelegate(_ command: CDVInvokedUrlCommand) -> CastRequestDelegate {
        self.checkFinishedDelegates()

        let delegate = CastRequestDelegate(success: {
            let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate!.send(pluginResult, callbackId: command.callbackId)
        }, failure: {(error: GCKError) in
            let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR)
            self.commandDelegate!.send(pluginResult, callbackId: command.callbackId)
        }, abortion: { (abortReason: GCKRequestAbortReason) in
            let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR)
            self.commandDelegate!.send(pluginResult, callbackId: command.callbackId)
        })

        self.requestDelegates.append(delegate)

        return delegate
    }

    func setReceiverVolumeLevel(_ withCommand: CDVInvokedUrlCommand, newLevel: Float) {
        let delegate = self.createGeneralRequestDelegate(withCommand)

        let request = remoteMediaClient?.setStreamVolume(newLevel)
        request?.delegate = delegate
    }

    func setReceiverMuted(_ withCommand: CDVInvokedUrlCommand, muted: Bool) {
        let delegate = self.createGeneralRequestDelegate(withCommand)

        let request = remoteMediaClient?.setStreamMuted(muted)
        request?.delegate = delegate
    }

    func loadMedia(_ withCommand: CDVInvokedUrlCommand, mediaInfo: GCKMediaInformation, autoPlay: Bool, currentTime: Double) {
        self.checkFinishedDelegates()

        let requestDelegate = CastRequestDelegate(success: {
            let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: CastUtilities.createMediaObject(self.currentSession!) as! [String : Any])
            self.commandDelegate!.send(pluginResult, callbackId: withCommand.callbackId)
        }, failure: {(error: GCKError) in
            let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: error.description)
            self.commandDelegate!.send(pluginResult, callbackId: withCommand.callbackId)
        }, abortion: { (abortReason: GCKRequestAbortReason) in
            let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: abortReason.rawValue)
            self.commandDelegate!.send(pluginResult, callbackId: withCommand.callbackId)
        })
        self.requestDelegates.append(requestDelegate)

        let options = GCKMediaLoadOptions.init()
        options.autoplay = autoPlay
        options.playPosition = currentTime

        let request = remoteMediaClient?.loadMedia(mediaInfo, with: options)
        request?.delegate = requestDelegate
    }

    func createMessageChannel(_ withCommand: CDVInvokedUrlCommand, namespace: String) {
        let newChannel = GCKGenericChannel(namespace: namespace)
        newChannel.delegate = self

        self.genericChannels.updateValue(newChannel, forKey: namespace)
        self.currentSession?.add(newChannel)

        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK)
        self.commandDelegate!.send(pluginResult, callbackId: withCommand.callbackId)
    }

    func sendMessage(_ withCommand: CDVInvokedUrlCommand, namespace: String, message: String) {
        let channel = self.genericChannels[namespace] ?? nil

        var pluginResult =  CDVPluginResult(
            status: CDVCommandStatus_ERROR,
            messageAs: "Namespace '\(namespace)' not fouded."
        )

        if channel != nil {
            var error: GCKError?
            channel?.sendTextMessage(message, error: &error)

            if error != nil {
                pluginResult =  CDVPluginResult(
                    status: CDVCommandStatus_ERROR,
                    messageAs: error!.description
                )
            } else {
                pluginResult =  CDVPluginResult(
                    status: CDVCommandStatus_OK
                )
            }
        }

        self.commandDelegate!.send(
            pluginResult,
            callbackId: withCommand.callbackId
        )
    }

    func mediaSeek(_ withCommand: CDVInvokedUrlCommand, position: TimeInterval, resumeState: GCKMediaResumeState) {
        let delegate = self.createGeneralRequestDelegate(withCommand)

        let options = GCKMediaSeekOptions()
        options.interval = position
        options.resumeState = resumeState

        let request = remoteMediaClient?.seek(with: options)
        request?.delegate = delegate
    }


    func mediaPlay(_ withCommand: CDVInvokedUrlCommand) {
        let delegate = self.createGeneralRequestDelegate(withCommand)

        let request = remoteMediaClient?.play()
        request?.delegate = delegate
    }

    func mediaPause(_ withCommand: CDVInvokedUrlCommand) {
        let delegate = self.createGeneralRequestDelegate(withCommand)

        let request = remoteMediaClient?.pause()
        request?.delegate = delegate
    }

    func mediaStop(_ withCommand: CDVInvokedUrlCommand) {
        let delegate = self.createGeneralRequestDelegate(withCommand)

        let request = remoteMediaClient?.stop()
        request?.delegate = delegate
    }

    func setActiveTracks(_ withCommand: CDVInvokedUrlCommand, activeTrackIds: [NSNumber], textTrackStyle: GCKMediaTextTrackStyle?) {
        let delegate = self.createGeneralRequestDelegate(withCommand)

        var request = remoteMediaClient?.setActiveTrackIDs(activeTrackIds)
        request?.delegate = delegate

        request = remoteMediaClient?.setTextTrackStyle(textTrackStyle)
    }

    private func checkFinishedDelegates() {
        self.requestDelegates = self.requestDelegates.filter({ (delegate: CastRequestDelegate) -> Bool in
            return !delegate.finished
        })
    }
}

extension ChromecastSession : GCKSessionManagerListener {
    func sessionManager(_ sessionManager: GCKSessionManager, didStart session: GCKCastSession) {
        self.currentSession = session
        self.remoteMediaClient = session.remoteMediaClient
        self.remoteMediaClient?.add(self)

        let pluginResult = CDVPluginResult(
            status: CDVCommandStatus_OK,
            messageAs: CastUtilities.createSessionObject(session) as! [String: Any]
        )

        self.commandDelegate!.send(
            pluginResult,
            callbackId: self.initialCommand?.callbackId
        )
    }

    func sessionManager(_ sessionManager: GCKSessionManager, didEnd session: GCKCastSession, withError error: Error?) {
        self.currentSession = nil
        self.remoteMediaClient = nil

        if error != nil {
            let pluginResult = CDVPluginResult(
                status: CDVCommandStatus_ERROR,
                messageAs: error.debugDescription as String
            )
            self.commandDelegate!.send(
                pluginResult,
                callbackId: initialCommand?.callbackId
            )
        }

       self.sessionListener?.onSessionUpdated(CastUtilities.createSessionObject(session), isAlive: false)
    }
}

extension ChromecastSession : GCKRemoteMediaClientListener {
    func remoteMediaClient(_ client: GCKRemoteMediaClient, didStartMediaSessionWithID sessionID: Int) {
        let media = CastUtilities.createMediaObject(self.currentSession!)

        self.sessionListener?.onMediaLoaded(media)
    }

    func remoteMediaClient(_ client: GCKRemoteMediaClient, didUpdate mediaStatus: GCKMediaStatus?) {
        if self.currentSession == nil {
           self.sessionListener?.onMediaUpdated([:], isAlive: false)
           return
        }

        let media = CastUtilities.createMediaObject(self.currentSession!)
        self.sessionListener?.onMediaUpdated(media, isAlive: true)
    }

    func remoteMediaClientDidUpdatePreloadStatus(_ client: GCKRemoteMediaClient) {
        self.remoteMediaClient(client, didUpdate: nil)
    }
}

extension ChromecastSession : GCKGenericChannelDelegate {
    func cast(_ channel: GCKGenericChannel, didReceiveTextMessage message: String, withNamespace protocolNamespace: String) {
        let currentSession = CastUtilities.createSessionObject(self.currentSession!)

        self.sessionListener?.onMessageReceived(currentSession, namespace: protocolNamespace, message: message)
    }
}
