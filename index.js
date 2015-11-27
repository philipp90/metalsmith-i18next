'use strict'

var i18next    = require('i18next'),
	multimatch = require('multimatch'),
	path       = require('path'),
	debug      = require('debug')('metalsmith-i18next')

/**

 Forks multiple versions of the website (one for each locale).

 @param {Object} options 
 @param {String|String[]} pattern      - A list of patterns to match files against.
 @param {String|String[]} namespaces   - A list of i18next namespaces to load.
 @param {String}          nsPath       - String to pass i18next as the resGetPath parameter.
 @param {String}          path         - String to expand the localized path to. Defaults to ':locale/:path'.

      Given the original path /folder/file.html and an 'en' locale, the 
      following variables are available for substitution:

        :file     => /folder/file.html
        :ext      => .html
        :base     => file.html
        :dir      => /folder 
        :name     => file
        :locale   => en

 Frontmatters can define the following properties:

	i18nNamespace           i18next namespace to lookup for the key.
 	i18nPrefix				tt function will be the same as t but with key prefix to reduces noise in the code.

 Templates and layouts have access to the following helper functions:

   t(key, options) 			i18next.t function with a preset locale that can be overriden in the options.
   tt(key, options)         i18next.t function with a preset locale and key prefix (see i18nPrefix above).
   tpath(path) 				Prefixes an absolute path with the /:locale. Relative paths are unchanged.

*/

module.exports = function(options) {

	// ------------------------------------------------------------------------
	// Set default values on the options
	// ------------------------------------------------------------------------

	options = Object.assign({
		locales:     [],
		pattern:    '**/*',
		path:       ':locale/:file',
		namespaces: ['translation'],
		nsPath:     './locales/__lng__/__ns__.json',
	}, options || {})

	debug('Options are')
	debug(options)

	// ------------------------------------------------------------------------
	// Do some minimal validation on the options
	// ------------------------------------------------------------------------

	var locales    = options.locales,
		pattern    = options.pattern,
		pathpat    = options.path,
		resGetPath = options.nsPath,
		namespaces = options.namespaces

	if (typeof locales != 'string' && !Array.isArray(locales))
		throw new TypeError('metalsmith-i18next locales option should be a string or an array of strings')

	if (typeof pattern !== 'string' && !Array.isArray(pattern))
		throw new TypeError('metalsmith-i18next pattern option should be a string or an array of strings')

	if (typeof pathpat !== 'string')
		throw new TypeError('metalsmith-i18next path option should be a string')

	if (typeof namespaces !== 'string' && !Array.isArray(namespaces))
		throw new TypeError('metalsmith-i18next namespaces option should be a string or an array of strings')

	if (typeof resGetPath !== 'string')
		throw new TypeError('metalsmith-i18next nsPath option should be a string')

	if (!Array.isArray(locales))
		locales = [locales]

	if (locales.length === 0)
		throw new Error('metalsmith-i18next locales options thould contain at least one locale')

	if (!Array.isArray(namespaces))
		namespaces = [namespaces]

	if (!namespaces.length)
		throw new Error('metalsmith-i18next namespaces option should be a string or an array of strings')


	// ------------------------------------------------------------------------
	// Helpers
	// ------------------------------------------------------------------------

	function fileMatchesPattern(file) {
		return !!(multimatch([file], pattern).length)
	}

	function localizedFilePath(file, locale) {

		var ext   = path.extname(file),
			base  = path.basename(file),
			dir   = path.dirname(file),
			name  = path.basename(file, ext),
			parts = {ext, base, dir, name, file, locale}

		debug(parts)

		return pathpat.replace(/:(\w+)/g, function(match){			
			return parts[match.slice(1)] || match
		}).replace(/^\.\//, '')
	}


	// ------------------------------------------------------------------------
	// Setup i18next
	// ------------------------------------------------------------------------

	i18next.init({
		lng: locales[0],
		resGetPath,
		ns: {namespaces, defaultNs:namespaces[0]},
		preload: locales,
		getAsync: false,
		fallbackLng: false
		// debug: true
	})

	return function(files, metalsmith, done) {

		// Loop through all of the files
		Object.keys(files).forEach(function(file){

			// Process only the ones that match our pattern
			if (fileMatchesPattern(file)) {

				debug('Processing %s', file)

				// Loop on each locale
				locales.forEach(function(locale){

					// Copy the original file object, determine its new path.
					let f = Object.assign({}, files[file]),
					    p = localizedFilePath(file, locale),
					    dot = ((f.i18nPrefix || '').indexOf(':') < 0)? ':' : '.'

					// Add the current locale
					f.locale = locale

					// Create some template helper functions: t, tt, tpath
					f.t = function(key, options) {

						options = options || {}
						options.lng = options.lng || locale

						if (key.indexOf(':') < 0)
							key = (f.i18nNamespace || namespaces[0]) + ':' + key

						return i18next.translate(key, options)
					}

					f.tt = (typeof f.i18nPrefix !== 'string')? f.t : function(key, options) {
						return f.t(f.i18nPrefix + '.' + key, options)
					}

					f.tpath = function(path, lang) {					
						if (path[0] !== '/') 
							return path
						return '/' + localizedFilePath(path.slice(1), lang || locale)
					}

					// Add the new file to the list of files
					debug('Adding file %s', p)
					files[p] = f
				})	

				// Delete the original file once all locale specific files have been added
				debug('Removing file %s', file)
				delete files[file]
			}
		})

		done()
	}
}