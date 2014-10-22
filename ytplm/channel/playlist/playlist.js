ytplm.playlist = function(p, readOnly) {
	this.createDom(p, readOnly);
	this.loadVideos(p.id, p.contentDetails.itemCount);
	this.privacy(this.originalPrivacy);
};

ytplm.playlist.privacyValues = [
	'public',
	'private',
	'unlisted'
];
ytplm.playlist.privacyClasses = {
	public:   ['Public',   'fa fa-globe'],
	private:  ['Private',  'fa fa-lock'],
	unlisted: ['Unlisted', 'fa fa-unlock-alt']
};

ytplm.playlist.prototype = {
	createDom: function(p, readOnly) {
		this.originalName = p.snippet.title;
		this.originalPrivacy = p.status.privacyStatus;
		this.jq_scope = $(
			'<div class="playlist">'+
				'<div class="table header">'+
					'<a class="privacy"'+(readOnly ? '' : ' href="#"')+'></a>'+
					'<a target="_blank" title="Open this playlist in YouTube" class="fa fa-external-link" href="//youtube.com/playlist?list='+p.id+'"></a>'+
					'<div class="name">'+
						'<input '+(readOnly ? 'readonly ' : '')+'type="text" class="span" placeholder="New playlist" value="'+p.snippet.title+'"/>'+
					'</div>'+
					'<div class="count"></div>'+
				'</div>'+
				'<div class="body">'+
					'<div class="bg"></div>'+
					'<div class="jqdragndrop-drop"></div>'+
					'<i class="waiting fa fa-refresh fa-spin"></i>'+
				'</div>'+
			'</div>'
		);
		var self = this;
		this.jq_bg = this.jq_scope.find('.bg');
		this.el_inputName = this.jq_scope.find('.name input')[0];
		this.jq_drop = this.jq_scope.find('.jqdragndrop-drop');
		this.nl_drags = this.jq_drop[0].getElementsByTagName('b');
		this.jq_drop[0]._playlist = this;
		this.el_count = this.jq_scope.find('.count')[0];
		this.jq_privacy = this.jq_scope.find('.privacy');
		if (!readOnly)
			this.jq_privacy.click(function() {
				self.privacy(
					ytplm.playlist.privacyValues[
						(1 + $.inArray(self.privacy(), ytplm.playlist.privacyValues))
						% ytplm.playlist.privacyValues.length
					]
				);
				return false;
			});
	},
	privacy: function(status) {
		var el = this.jq_privacy[0];
		if (!status)
			return el.getAttribute('value');
		el.setAttribute('value', status);
		el.className = 'privacy ' + ytplm.playlist.privacyClasses[status][1];
		el.title = ytplm.playlist.privacyClasses[status][0];
	},
	refresh: function() {
		this.findBackground();
		this.setNbVideos(this.nl_drags.length);
	},
	setNbVideos: function(nb) {
		this.el_count.textContent = nb;
	},
	domDiff: function() {
		var
			self = this,
			name = this.originalName,
			newName = this.el_inputName.value,
			privacy = this.originalPrivacy,
			newPrivacy = this.privacy(),
			isDiff = false,
			diffTab = diff(this, this.nl_drags),
			videos = [],
			df = {
				name: name
			};
		if (name !== newName) {
			df.newName = newName;
			isDiff = true;
		}
		if (privacy !== newPrivacy) {
			df.privacy = privacy;
			df.newPrivacy = newPrivacy;
			isDiff = true;
		}
		$.each(diffTab, function(i) {
			if (this[0]) {
				var	video = this[1]._video,
					status = this[0] > 0 ? 'add' : 'del';
				$.each(diffTab, function(j) {
					if (i !== j && !this.seen && video.id === this[1]._video.id) {
						status = status === 'add'
							? (i < j ? 'up' : 'down')
							: (i > j ? 'up' : 'down');
						this.seen = true;
						return false;
					}
				});
				if (!this.seen)
					videos.push({
						status: status,
						name: video.title,
						img: video.imgDef,
						pos: 0
					});
			}
		});
		if (videos.length > 0) {
			df.videos = videos;
			isDiff = true;
		}
		return isDiff ? df : null;
	},
	loadVideos: function(id, nbVideos) {
		this.setNbVideos(nbVideos);
		if (nbVideos > 0) {
			var self = this;
			this.jq_scope.addClass('waiting');
			ytplm.extractData(
				gapi.client.youtube.playlistItems.list,
				{
					playlistId: id,
					part: 'snippet',
					maxResults: 50
				},
				function(data) {
					self.length = data.length;
					$.each(data, function(i) {
						self[i] = (new ytplm.video(this)).jq_scope[0];
						self.jq_drop.append(self[i]);
					});
					self.jq_scope.removeClass('waiting');
					self.findBackground();
				}
			);
		}
	},
	findBackground: function() {
		var	self = this;
		function bg(url) {
			self.jq_bg.css('background-image', url ? 'url("' + url + '")' : 'none');
			return url;
		}
		if (this.el_videoBackground !== this.nl_drags[0]) {
			var changed = false;
			$.each(this.nl_drags, function() {
				if (bg(this._video.imgMed)) {
					changed = true;
					self.el_videoBackground = this;
					return false;
				}
			});
			if (!changed)
				bg();
		}
	}
};
