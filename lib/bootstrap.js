'use strict'

module.exports = function(config) {
	return `
i18nHelpers.prop = function(value) { return function(v) { return arguments.length? (value=v) : value }}
i18n.init(${JSON.stringify(config.i18n)})
i18n.helpers = i18nHelpers({
    namespace: i18nHelpers.prop('${config.namespace}'),
    prefix:    i18nHelpers.prop('${config.prefix}'),
    locale:    i18nHelpers.prop('${config.locale}'),
    path:      i18nHelpers.prop('${config.path}')
})

t     = i18n.helpers.t
tt    = i18n.helpers.tt
tpath = i18n.helpers.tpath
`
}
