'use strict'

module.exports = function(config) {
	return `

;(function(root){
	
	var prop = function(value){ return function(v) { return arguments.length? (value=v) : value }}
	
	if (!root.i18n)
		throw new Error('i18next must be loaded before bootstraping the client.')

	root.i18n.init(${JSON.stringify(config.i18n)})
	
	if (!root.i18nHelpers)
		throw new Error('i18nHelpers must be loaded before bootstraping the client')

	var h = root.i18nHelpers({
        namespace: prop('${config.namespace}'),
        prefix:    prop('${config.prefix}'),
        locale:    prop('${config.locale}'),
        path:      prop('${config.path}')
    })

    root.t     = h.t
    root.tt    = h.tt
    root.tpath = h.tpath

})(window)

`
}
