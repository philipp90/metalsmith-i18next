'use strict'

module.exports = function i18nHelpers(i18next, options) {

	options = options || {}
	
	var path      = options.path      || function() { return ':locale/:file' },
		prefix    = options.prefix    || function() { return '' },
		locale    = options.locale    || i18next.lng,
		namespace = options.namespace || function() { return '' }

	if (typeof path !== 'function')
		throw new TypeError('metalsmith-i18next helpers expects path option of type function')

	if (typeof locale !== 'function')
		throw new TypeError('metalsmith-i18next helpers expects locale option of type function')

	if (typeof namespace !== 'function')
		throw new TypeError('metalsmith-i18next helpers expects namespace option of type function')

	if (typeof prefix !== 'function')
		throw new TypeError('metalsmith-i18next helpers expects prefix option of type function')


	/**

	  @param {String} file  			- relative file
	  @param {String} [lang]            - optional locale override

	  Given the relative file path folder/file.html and an 'en' lang, the 
      following variables are available for substitution:

        :file     => folder/file.html
        :ext      => .html
        :base     => file.html
        :dir      => folder 
        :name     => file
        :locale   => en

	*/
	function fileParts(file, lang) {

		var i, j, q, h, x, base, name, ext, dir, query, hash

		if (!file) file = ''

		function slice(i, j, debug) {
			return file.slice(i, j >= 0? j : undefined)
		}

		i = file.lastIndexOf('/') + 1
		j = file.lastIndexOf('.')
		q = file.lastIndexOf('?')
		h = file.lastIndexOf('#')
		x = (q >= 0 && h >= 0)? Math.min(q, h) : Math.max(q, h)

		lang  = lang || locale()
		base  = slice(i,x)
		dir   = ''
		ext   = ''
		query = ''
		hash  = ''

		if (i > 0)
			dir = slice(0,i-1)

		if (j > i) {
			ext  = slice(j,x)
			name = slice(i,j)
		}

		if (q >= 0)
			query = slice(q,h)
		
		if (h >= 0)
			hash = slice(h)

		return {file:file, base:base, dir:dir, name:name, ext:ext, query:query, hash:hash, locale:lang}
	}


	/**

	  Using the path template, substitute the files parts and return 
	  a localised file path. See fileParts for details.

	  @param {String} file  			- relative file
	  @param {String} [lang]            - optional locale override

	*/
	function localisedFilePath(file, lang) {

		var parts = fileParts(file, lang),
			orig  = file

		// Substitute file parts in the path template
		file = path().replace(/:(\w+)/g, function(match){
			var subst = parts[match.slice(1)]
			return (subst !== undefined)? subst : match
		})

		// Remove leading / or ./ 
		file = file.replace(/^\.?\//, '')

		// Add the trailing / back if there was one
		if (orig && orig.slice(-1) === '/')
			file = file + '/'

		return file
	}

	function t(key, params) {

		params = params || {}
		params.lng = params.lng || locale()

		if (key.indexOf(':') < 0)
			key = (params.namespace || namespace()) + ':' + key

		return i18next.translate(key, params)
	}

	function tt(key, params) {
		var p = prefix()
		return t(p? p + '.' + key : key, params)
	}

	function tpath(path, lang) {					
		return (path[0] !== '/')? path : '/' + localisedFilePath(path.slice(1), lang)
	}

	var result = {localisedFilePath:localisedFilePath, t:t, tt:tt, tpath:tpath}

	if (process.env.NODE_ENV === 'test')
		result.fileParts = fileParts

	return result
}