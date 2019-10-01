
    /* eslint-disable no-undef */

            var interval = setInterval(function () {
                if (chrome && chrome.cast && chrome.cast.isAvailable) {
                    clearInterval(interval);
                    chrome.cast.cordova.stopRouteScan(function () {
                        throw new Error('Just gonna throw this error for demonstration');
                    });
                }
            }, 500);
