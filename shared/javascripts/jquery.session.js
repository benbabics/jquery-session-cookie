(function(window, $, undefined) {

var util = {
	/*
	 * Cookie Get/Set Mutator
	 *
	 * @access : private
	 * @param  : string
	 * @param  : string
	 * @param  : object
	 * @return : string
	*/
	cookie: function(key, value, options) {
		if (arguments.length > 1 && (value || value === null)) {
			options = $.extend({}, options);
			
			if (value === null) options.expires = -1;
			else if (typeof value === 'object') {
				value = util.stringJSON(value);
			}
			
			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setDate(t.getDate() + days);
			}

			return (document.cookie = [
				encodeURIComponent(key), '=',
				options.raw ? String(value) : encodeURIComponent(String(value)),
				
				// using "expires" attribute as "max-age" is not supported by IE
				options.expires ? '; expires=' + options.expires.toUTCString() : '',
				
				options.path ? '; path=' + options.path : '',
				options.domain ? '; domain=' + options.domain : '',
				options.secure ? '; secure' : ''
			].join(''));
		}
		
		// key and possibly options given, get cookie...
		options = value || {};
		var result, decode = options.raw ? function (s) { return s; } : decodeURIComponent;
		return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null;
	},

	/*
	 * Convert JSON object into a string
	 * 
	 * @access : private
	 * @param  : object (JSON object)
	 * @return : string
	 */
	stringJSON: function(obj) {
		var arr = [],
			isArray = obj instanceof Array;
		
		if (typeof obj == 'string') return obj;
		for (key in obj) {
			var val = obj[key];
			
			if (typeof val == 'object') {
				var str = (!isArray) ? '"' + key + '":' : "";
				str += util.stringJSON(val);
				arr.push(str);
			}
			else {
				var str = (!isArray) ? '"' + key + '":' : ""
				if (typeof val == 'number') str += val;
				else if (typeof val == 'boolean') str += (val) ? '"true"' : '"false"';
				else str += '"' + val + '"';
				arr.push(str);
			}
		}
		
		return (isArray) ? "[" + arr.join(',') + "]" : "{" + arr.join(',') + "}";
	}
},

/*
 * Application Session
 * Ability to store data locally and pass it between pages.
 * 
 * @access  : public
 * @pattern : singleton
 * @return  : object
*/
session: (function() {

	// take JSON object, stringify it and save it to cookie
	function save(session) {
		var json = util.stringJSON(session);
		return json;
	}

	/*
	 * Session constructor
	 *
	 * @access: public
	 * @param : string (name of cookie)
	 * @param : number (expiration of cookie)
	*/
	var instance = function(name, duration) {
		name     = name || "mctroller_session";
		duration = duration || 90;

		// Determine if cookie is set, take JSON string
		// make it an object and assign to var for use within other methods
		var session = $.parseJSON(util.cookie(name)) || {};

		/*
		 * Save the current state of the session data.
		 * Alternatively, this is done automatically whenever the session data is altered using methods set() or clear().
		 *
		 * @access : privileged
		 * @return : self
		*/
		this.save = function() {
			util.cookie(name, save(session), {
				path    : "/",
				expires : duration
			});
		};

		/*
		 * Session Accessor
		 * 
		 * @access : privileged
		 * @return : object
		*/
		this.session = function() {
			return session;
		};

		return this;
	};

	/*
	 * Session public methods
	 * Assigned to $.mctroller.session[methodName]
	 *
	 * @access: public
	*/
	instance.prototype = {

		/* 
		 * Access information saved between page loads in application.
		 *
		 * @access : public
		 * @param  : string (name of attribute in JSON object) ( e.g. $.mctroller.session.get('hasAcceptedTermsAndConditions'); ).
		 * @return : mixed (string || false)
		*/
		get: function(name) {
			var val = this.session()[name];
			if (val != undefined || val != null) {
				try {return eval(val)}
				catch(e) {return val}
			}
			return false;
		},

		/*
		 * Set and save information to be used between page loads in application.
		 *
		 * @access : public
		 * @param  : string ( e.g. "userEmailAddress" )
		 * @param  : string ( e.g. "johndoe@gmail.com" )
		 * @return : self
		*/
		set: function(name, val) {
			var session  = this.session()[name];
			this.session()[name] = ($.isPlainObject(val)) ?
				$.extend(session || {}, val)      :
				($.isArray(val))                  ?
				$.merge(session || [], val)       : val;

			this.save();
			return this;
		},

		/*
		 * Clear information specifc to existing attribute
		 *
		 * @access : public
		 * @param  : string ( e.g. "userEmailAddress" )
		 * @return : self
		*/
		clear: function(name) {
			function remove(n) { delete this.session()[n]; };

			if (name && this.get(name))
				remove.call(this, name);

			else if (name === undefined)
				for (n in this.session()) remove.call(this, n);

			this.save();
			return this;
		},

		/*
		 * View a dump of the session data for the application
		 *
		 * @access : public
		 * @return : stringified JSON
		*/
		dump: function() {
			return util.stringJSON(this.session());
		}
	};

	return instance;
})();

// add session namespace to jQuery
$.extend($, {
	session: session
});

})(this, jQuery);