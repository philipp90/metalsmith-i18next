'use strict'

var helpers = require('./helpers'),
    multimatch = require('multimatch')

module.exports = function(debug, i18next, options) { 

	function fileMatchesPattern(file) {
		return !!(multimatch([file], options.pattern).length)
	}

	var localizedFilePath = helpers(debug, i18next, options).localizedFilePath

	return function(files, metalsmith, done) {

		// Loop through all of the files
		Object.keys(files).forEach(function(file){

			// Process only the ones that match our pattern
			if (fileMatchesPattern(file)) {

				debug('Processing %s', file)

				// Loop on each locale
				options.locales.forEach(function(locale){

					// Copy the original file object, determine its new path.
					let f = Object.assign({}, files[file]),
					    p = localizedFilePath(file, locale),
					    h = helpers(debug, i18next, {
					    	locale, 
					    	ns: f.i18nNamespace, 
					    	prefix: f.i18nPrefix, 
					    	path: options.path
					    })
					    
					// Add the current locale
					f.locale = locale
					f.t      = h.t
					f.tt     = h.tt
					f.tpath  = h.tpath

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