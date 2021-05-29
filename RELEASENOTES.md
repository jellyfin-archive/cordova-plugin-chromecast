<!--
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
-->
## Release Notes for cordova-plugin-chromecast

### 2.0.1 (2020-11-28)

* (ios) Bug Fix - media loaded without any metadata caused crash

### 2.0.0 (2020-11-07)

* (ios) BREAKING - Update Google Cast SDK (iOS Sender -> 4.5.2)
    * Google Cast SDK - [iOS sender 4.5.0+](https://developers.google.com/cast/docs/release-notes#september-14,-2020) has minimum iOS 10
        * But, all tests on the plugin work fine for iOS 9.3.5, so it appears to work on iOS 9 anyways. :/ 
        * But, since cordova@6.x.x no longer supports iOS 9+10 we will only be testing on iOS 11+.
    * With the update, additional entries are required in `config.xml` for cast to work on iOs 14 (if built with Xcode 12+) (see README.md)

### 1.1.0 (2020-11-1)

* Update Google Cast SDKs (iOS -> 4.4.8, android -> 19.0.0)
    * New SDK supports casting to Android TV (untested)
* (android) simulate mediaSessionId
* Add Audiobook chapter metadata
* (android) Fix queue bug: media returned with no items
* (android) [Issue #73] Fix Push Notification stop casting button
* [Live stream issue](https://github.com/miloproductionsinc/cordova-plugin-chromecast/issues/11) Fix for live stream media

### 1.0.0 (2020-01-24)

* For full list of changes, see PR #54 
