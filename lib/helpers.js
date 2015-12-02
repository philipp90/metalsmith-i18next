'use strict'

module.exports = function(debug, i18next, options) {

	var path = require('path'),
	    url  = require('url')

	options  = options || {}
	options.path = options.path || ':locale/:file'
	options.locale = options.locale || i18next.lng

	debug('Helper options: %j', options)

	function localizedFilePath(file, locale) {

		var parts

		if (!file) {
			
			parts = {ext:'', base:'', dir:'.', name:'', file:'', locale}

		} else {

			var urlParts = url.parse(file, true),
			    pathname = urlParts.pathname,
				ext      = path.extname(pathname),
				base     = path.basename(pathname),
				dir      = path.dirname(pathname),
				name     = path.basename(pathname, ext)

				parts = {ext, base, dir, name, file, locale}
		}
			        
		debug('File parts: %j in %j', parts, options.path)

		urlParts.pathname = options.path.replace(/:(\w+)/g, function(match){
			var subst = parts[match.slice(1)]
			return (subst !== undefined)? subst : match
		}).replace(/^\.\//, '')

		if (pathname && pathname.slice(-1) === '/')
			urlParts.pathname = urlParts.pathname + '/'

		return url.format(urlParts)
	}

	function t(key, params) {

		params = params || {}
		params.lng = params.lng || options.locale

		if (key.indexOf(':') < 0)
			key = (params.ns || options.ns) + ':' + key

		return i18next.translate(key, params)
	}

	function tt(key, params) {
		var prefix = options.prefix
		return t(prefix? prefix + '.' + key : key, params)
	}

	function tpath(path, lang) {					
		return (path[0] !== '/')? path : '/' + localizedFilePath(path.slice(1), lang || options.locale)
	}

	return {localizedFilePath, t, tt, tpath}
}