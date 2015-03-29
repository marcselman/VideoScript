/*!
 * videoScript.js v0.14
 * Copyright 2015 SelmanMade
 *
 * Changes in 0.14
 * - Minor fixes for wider browser support
 * - Native controls fix for Firefox
 * - Added WebM priority
 *
 * Changes in 0.13
 * - Added alert when video is not found
 * - Script will not break when video's fail to load
 * - Buttons will not be created for video's that failed to load
 *
 * Changes in 0.12
 * - Added a transparent white background color to the buttons for older IE versions
 *
 * Freely distributable under the MIT license.
 */

window.videoScript = (function () {
	var videos = [];
	window.vds = videos;

	function getVideo(id) {
		var result = videos.filter(function (video, index) {
			return video.id === id;
		});
		if (result.length > 0) {
			return result[0];
		}
		return null;
	}

	function removeVideos(excepts) {
		var containerElem = document.getElementById(videoScript.containerId);
		for (var i = containerElem.children.length - 1; i >= 0; i--) {
			var child = containerElem.children[i];
			if (excepts.indexOf(child.id) == -1) {
				containerElem.removeChild(child);
			}
		};
	}

	function getVideoWrapper(id) {
		var video = getVideo(id);
		if (video == null) {
			alert('Video with id "' + id + '" not found');
			return null;
		}
		var wrapperElem = document.getElementById(id);
		if (wrapperElem) {
			return wrapperElem;
		}
		wrapperElem = document.createElement('div');
		wrapperElem.style.position = 'relative';
		wrapperElem.id = id;
		videoElem = document.createElement('video');
		videoElem.controls = video.controls === true;
		videoElem.setAttribute('controls', video.controls === true ? 'true' : 'false');
		videoElem.loop = video.loop === true;
		videoElem.preload = 'auto';
		videoElem.width = 800;
		videoElem.height = 450;
		if (video.nextVideo) {
			var nextVideo = getVideo(video.nextVideo);
			if (nextVideo != null) {
				videoElem.addEventListener('ended', function () {
					loadVideo(nextVideo.id);
				});
			}
		}
		if (video.buttons) {
			for (var i = 0; i < video.buttons.length; i++) {
				var button = video.buttons[i];
				if (getVideo(button.toVideo) == null) {
					continue;
				}
				var buttonElem = document.createElement('button');
				buttonElem.style.zIndex = 99;
				buttonElem.style.cursor = 'pointer';
				buttonElem.style.position = 'absolute';
				buttonElem.style.background = 'none';
				buttonElem.style.backgroundColor = 'rgba(255,255,255,0)';				
				buttonElem.style.border = 'none';
				buttonElem.style.top = button.position.top + 'px';
				buttonElem.style.left = button.position.left + 'px';
				buttonElem.style.width = button.size.width + 'px';
				buttonElem.style.height = button.size.height + 'px';
				buttonElem.type = 'button';
				buttonElem.addEventListener('click', function (button) {
					return function () {
						loadVideo(button.toVideo);
					};
				}(button));
				wrapperElem.appendChild(buttonElem);
			};
		}	
		for (var i = 0; i < video.sources.length; i++) {
			var sourceElem = document.createElement('source');
			sourceElem.src = video.sources[i].src;
			sourceElem.type = video.sources[i].type;
			if (sourceElem.type == 'video/webm') {
				videoElem.insertBefore(sourceElem, videoElem.firstChild);				
			}
			else {
				videoElem.appendChild(sourceElem);
			}
		};
		wrapperElem.appendChild(videoElem);
		return wrapperElem;
	}

	function preloadVideos(ids) {
		for (var i = 0; i < ids.length; i++) {
			var wrapperElem = document.getElementById(ids[i]);
			if (!wrapperElem) {
				wrapperElem = getVideoWrapper(ids[i]);
				if (wrapperElem != null) {
					var containerElem = document.getElementById(videoScript.containerId);
					containerElem.appendChild(wrapperElem);
				}
			}
			if (wrapperElem != null) {
				var videoElem = wrapperElem.getElementsByTagName('video')[0];
				tryStopVideo(videoElem);
				wrapperElem.style.display = 'none';
			}
		};
	}

	function loadVideo(id) {
		var video = getVideo(id);

		var ids = [];
		ids.push(id);
		if (video.nextVideo) {
			ids.push(video.nextVideo);
		}
		if (video.buttons) {
			for (var i = 0; i < video.buttons.length; i++) {
				ids.push(video.buttons[i].toVideo);
			};
		}

		preloadVideos(ids);
		removeVideos(ids);
		
		var wrapperElem = document.getElementById(id);
		wrapperElem.style.display = "block";
		var videoElem = wrapperElem.getElementsByTagName('video')[0];

		tryPlayVideo(videoElem);
	}

	function tryStopVideo(videoElem) {
		if (videoElem.readyState == 4) {
			videoElem.pause();
			videoElem.currentTime = 0;
		}
		else {
			setTimeout(function () {
				tryStopVideo(videoElem);
			}, 1000);
		}
	}
	function tryPlayVideo(videoElem) {
		if (videoElem.ended == true) {
			//videoElem.play();
			videoElem.currentTime = 0;
		}
		console.info(videoElem.readyState);
		if (videoElem.readyState == 4) {
			videoElem.currentTime = 0;
			videoElem.play();

		}
		else {
			setTimeout(function () {
				tryPlayVideo(videoElem);
			}, 1000);
		}
	}
	function loadVideos(url) {
		var xmlhttp;

		if (window.XMLHttpRequest) {
			// code for IE7+, Firefox, Chrome, Opera, Safari
			xmlhttp = new XMLHttpRequest();
		}
		else {
			// code for IE6, IE5
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}

		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4 ) {
				if(xmlhttp.status == 200) {
					videos = JSON.parse(xmlhttp.responseText).videos;
					loadVideo(videos[0].id);
				}
				else if(xmlhttp.status == 400) {
					alert('There was an error 400')
				}
				else {
					alert('Could not load videos')
				}
			}
		}

		xmlhttp.open("GET", url, true);
		xmlhttp.send();
	}

	var videoScript = {
		loadUrl: function(url) {
			loadVideos(url);
		},
		loadData: function(jsonData) {
			videos = jsonData.videos;
			loadVideo(videos[0].id);
		},
		containerId: 'videoContainer'
	};

	return videoScript;
})();