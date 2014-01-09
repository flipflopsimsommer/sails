/**
 * Module dependencies
 */
var express		= require('express');


module.exports = function (sails) {

	/**
	 * This will just create a copy of the Connect bodyParser, but use Sails.log
	 * instead of console.warn to avoid spitting unexpected output to the console.
	 * 
	 * @param  {Object} options
	 * @return {Middleware}
	 */
	return function multipart (options) {

		if (! sails.config.express.silenceMultipartWarning && process.env.NODE_ENV !== 'test') {
			sails.log.warn('File uploads are changing.');
			sails.log.warn('`connect.multipart()` will be removed in Express 4.0 / Connect 3.0.');
			sails.log.warn();
			sails.log.warn('For alternatives and more info, check out:');
			sails.log.warn('-> https://gist.github.com/mikermcneil/8249181');
			sails.log.warn('-> https://github.com/senchalabs/connect/wiki/Connect-3.0');
			sails.log.warn();
			sails.log.warn('(to silence this warning, change `config/express.js`)');
		}

		// Override console.warn for just a little bit
		var _original = console.warn;
		console.warn = function () {};
		var multipartBodyParser = express.multipart(options);
		console.warn = _original;
		return multipartBodyParser;
	};

};