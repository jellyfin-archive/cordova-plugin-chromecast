/**
 * Utility functions for creating media requests and checking returned media
 * states.
 */

(function () {
    'use strict';
    /* eslint-env mocha */
    /* global chrome */
    var assert = window.chai.assert;

    var audioUrl = 'https://ia800306.us.archive.org/26/items/1939RadioNews/1939-10-24-CBS-Elmer-Davis-Reports-City-Of-Flint-Still-Missing.mp3';
    var imageUrl = 'https://ia800705.us.archive.org/1/items/GoodHousekeeping193810/Good%20Housekeeping%201938-10.jpg';
    var liveAudioUrl = 'http://relay.publicdomainproject.org/classical.mp3';
    var videoUrl = 'https://ia801302.us.archive.org/1/items/TheWater_201510/TheWater.mp4';

    var mediaUtils = {
        CONTENT_TYPE: {
            'VIDEO': function () {
                return new chrome.cast.media.MediaInfo(videoUrl, 'video/mp4');
            },
            'AUDIO': function () {
                return new chrome.cast.media.MediaInfo(audioUrl, 'audio/mpeg');
            },
            'IMAGE': function () {
                return new chrome.cast.media.MediaInfo(imageUrl, 'image/jpeg');
            },
            'LIVE_AUDIO': function () {
                return new chrome.cast.media.MediaInfo(liveAudioUrl, 'audio/mpeg');
            }
        }
    };

    /**
     * Returns a new media item for use in requests.
     *
     * @param {*} contentType - Must be a string matching one of
     * mediaUtils.CONTENT_TYPE or a chrome.cast.media.MediaInfo object.
     * @param {chrome.cast.media.*Metadata} metadataType - (optional) Must be a
     * chrome.cast.media.*Metadata object, or null.
     * @param {Date} metadataDate - (optional) Used for any metadata fields where
     * you would prefer the date to be constant.
     */
    mediaUtils.getMediaInfoItem = function (contentType, metadataType, metadataDate) {
        // Get the content
        if (mediaUtils.CONTENT_TYPE[contentType]) {
            contentType = mediaUtils.CONTENT_TYPE[contentType]();
        } else {
            assert.instanceOf(contentType, chrome.cast.cordova.MediaInfo);
        }
        // Get the metadata
        if (metadataType !== undefined && metadataType !== null) {
            contentType.metadata = generateMetadata(metadataType, metadataDate);
        }
        return contentType;
    };

    /**
     * Asserts that the 2 MediaInfo items are equivalent.
     * @param {chrome.cast.media.MediaInfo} actual
     * @param {chrome.cast.media.MediaInfo} expected
     */
    mediaUtils.assertMediaInfoItemEquals = function (actual, expected) {
        // Test MediaInfo direct properties
        assert.equal(actual.contentId, expected.contentId);
        if (!actual.metadata && !expected.metadata) {
            return; // No metadata to check
        }
        // Test common *Metadata properties
        assert.equal(actual.metadata.images[0].url, expected.metadata.images[0].url);
        assert.equal(actual.metadata.metadataType, expected.metadata.metadataType);
        assert.equal(actual.metadata.queueItemId, expected.metadata.queueItemId);
        assert.equal(actual.metadata.sectionDuration, expected.metadata.sectionDuration);
        assert.equal(actual.metadata.sectionStartAbsoluteTime, expected.metadata.sectionStartAbsoluteTime);
        assert.equal(actual.metadata.sectionStartTimeInContainer, expected.metadata.sectionStartTimeInContainer);
        assert.equal(actual.metadata.sectionStartTimeInMedia, expected.metadata.sectionStartTimeInMedia);
        assert.equal(actual.metadata.title, expected.metadata.title);
        assert.equal(actual.metadata.type, expected.metadata.type);
        assert.equal(actual.metadata.xMyMadeUpMetadata, expected.metadata.xMyMadeUpMetadata);
        // Test unique Metadata properties
        switch (actual.metadata.type) {
        case chrome.cast.media.MetadataType.AUDIOBOOK_CHAPTER:
            assert.equal(actual.metadata.bookTitle, expected.metadata.bookTitle);
            assert.equal(actual.metadata.chapterNumber, expected.metadata.chapterNumber);
            assert.equal(actual.metadata.chapterTitle, expected.metadata.chapterTitle);
            assert.equal(actual.metadata.subtitle, expected.metadata.subtitle);
            break;
        case chrome.cast.media.MetadataType.GENERIC:
            assert.equal(actual.metadata.releaseDate, expected.metadata.releaseDate);
            assert.equal(actual.metadata.releaseDate, expected.metadata.releaseDate);
            break;
        case chrome.cast.media.MetadataType.MOVIE:
            assert.equal(actual.metadata.studio, expected.metadata.studio);
            break;
        case chrome.cast.media.MetadataType.MUSIC_TRACK:
            assert.equal(actual.metadata.albumArtist, expected.metadata.albumArtist);
            assert.equal(actual.metadata.albumName, expected.metadata.albumName);
            assert.equal(actual.metadata.artist, expected.metadata.artist);
            assert.equal(actual.metadata.composer, expected.metadata.composer);
            assert.equal(actual.metadata.songName, expected.metadata.songName);
            assert.equal(actual.metadata.releaseDate, expected.metadata.releaseDate);
            break;
        case chrome.cast.media.MetadataType.PHOTO:
            assert.equal(actual.metadata.artist, expected.metadata.artist);
            assert.equal(actual.metadata.height, expected.metadata.height);
            assert.equal(actual.metadata.creationDateTime, expected.metadata.creationDateTime);
            assert.equal(actual.metadata.latitude, expected.metadata.latitude);
            assert.equal(actual.metadata.location, expected.metadata.location);
            assert.equal(actual.metadata.longitude, expected.metadata.longitude);
            assert.equal(actual.metadata.width, expected.metadata.width);
            break;
        case chrome.cast.media.MetadataType.TV_SHOW:
            assert.equal(actual.metadata.episode, expected.metadata.episode);
            assert.equal(actual.metadata.originalAirDate, expected.metadata.originalAirDate);
            assert.equal(actual.metadata.season, expected.metadata.season);
            assert.equal(actual.metadata.seriesTitle, expected.metadata.seriesTitle);
            assert.equal(actual.metadata.subtitle, expected.metadata.subtitle);
            break;
        default:
            assert.fail('Unknown metadata type: "' + actual.metadata.type + '"');
        }
    };

    function generateMetadata (metadataType, metadataDate) {
        var metadata;
        metadataDate = (metadataDate && metadataDate.valueOf()) || new Date().valueOf();
        switch (metadataType) {
        case chrome.cast.media.MetadataType.AUDIOBOOK_CHAPTER:
            metadata = new chrome.cast.media.AudiobookChapterMediaMetadata();
            metadata.bookTitle = 'AudiobookBookTitle';
            metadata.chapterNumber = 12;
            metadata.chapterTitle = 'AudiobookChapterTitle';
            metadata.subtitle = 'AudiobookSubtitle';
            break;
        case chrome.cast.media.MetadataType.GENERIC:
            metadata = new chrome.cast.media.GenericMediaMetadata();
            metadata.releaseDate = metadataDate;
            metadata.subtitle = 'GenericSubtitle';
            break;
        case chrome.cast.media.MetadataType.MOVIE:
            metadata = new chrome.cast.media.MovieMediaMetadata();
            metadata.studio = 'MovieStudio';
            metadata.subtitle = 'MovieSubtitle';
            break;
        case chrome.cast.media.MetadataType.MUSIC_TRACK:
            metadata = new chrome.cast.media.MusicTrackMediaMetadata();
            metadata.albumArtist = 'MusicAlbumArtist';
            metadata.albumName = 'MusicAlbum';
            metadata.artist = 'MusicArtist';
            metadata.composer = 'MusicComposer';
            metadata.releaseDate = metadataDate;
            metadata.songName = 'MusicSongName';
            break;
        case chrome.cast.media.MetadataType.PHOTO:
            metadata = new chrome.cast.media.PhotoMediaMetadata();
            metadata.artist = 'PhotoArtist';
            metadata.height = 100;
            metadata.creationDateTime = metadataDate;
            metadata.latitude = 102.13;
            metadata.location = 'PhotoLocation';
            metadata.longitude = 101.12;
            metadata.width = 100;
            break;
        case chrome.cast.media.MetadataType.TV_SHOW:
            metadata = new chrome.cast.media.TvShowMediaMetadata();
            metadata.episode = 15;
            metadata.originalAirDate = metadataDate;
            metadata.season = 2;
            metadata.seriesTitle = 'TvSeries';
            metadata.subtitle = 'TvSubtitle';
            break;
        default:
            assert.fail('Unknown metadata type: "' + metadataType + '"');
        }
        // Add common metadata
        metadata.images = [new chrome.cast.Image(imageUrl)];
        metadata.title = 'Title-' + metadata.type;
        metadata.xMyMadeUpMetadata = 'MyMadeUpMetadata-' + metadata.type;
        return metadata;
    }

    window['cordova-plugin-chromecast-tests'] = window['cordova-plugin-chromecast-tests'] || {};
    window['cordova-plugin-chromecast-tests'].mediaUtils = mediaUtils;
}());
