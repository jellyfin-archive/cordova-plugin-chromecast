import GoogleCast

class CastRequestDelegate : NSObject, GCKRequestDelegate {
  var didSuccess:()->()
  var didFail:((GCKError) -> ())?
  var didAbort:((GCKRequestAbortReason) -> ())?
  var finished: Bool

  init(success:@escaping ()->(),
      failure:((GCKError) -> ())? = nil,
      abortion:((GCKRequestAbortReason) -> ())? = nil
  ) {
      self.didSuccess = success
      self.didFail = failure
      self.didAbort = abortion
      self.finished = false
  }

  func requestDidComplete(_ request: GCKRequest) {
    self.didSuccess()
    self.finished = true
  }

  func request(_ request: GCKRequest, didFailWithError error: GCKError) {
    self.didFail?(error)
    self.finished = true
  }

  func request(_ request: GCKRequest, didAbortWith abortReason: GCKRequestAbortReason) {
    self.didAbort?(abortReason)
    self.finished = true
  }
}

protocol CastSessionListener {
    func onMediaLoaded(_ media: NSDictionary)
    func onMediaUpdated(_ media: NSDictionary, isAlive: Bool)
    func onSessionUpdated(_ session: NSDictionary, isAlive: Bool)
    func onMessageReceived(_ session: NSDictionary, namespace: String, message: String)
}
