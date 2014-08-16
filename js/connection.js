ytplm.connection = {
	id: {
		client_id: '514381834459-gr3dgmesev8jflg5364piutqb6alb35b.apps.googleusercontent.com',
		scope: ['https://www.googleapis.com/auth/youtube']
	},
	bodyStatus: function(status) {
		document.body.setAttribute('connected', status);
	},
	logout: function() {
		gapi.auth.signOut();
		ytplm.playlists.empty();
		this.bodyStatus(0);
	},
	login: function(now) {
		var self = this;
		this.id.immediate = now;
		gapi.auth.authorize(this.id, function(authResult) {
			if (authResult.status.signed_in) {
				gapi.client.load('youtube', 'v3', function() {
					self.bodyStatus(1);
					ytplm.playlists.load();
				});
			} else {
				self.bodyStatus(0);
				console.log('Connection failed... :(');
			}
		});
	},
	gapiOnload: function() {
		var self = this;
		gapi.auth.init(function() {
			setTimeout(function() {
				self.login(true);
			}, 1);
		});
	}
};
