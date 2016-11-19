'use strict';

const nunjucks = require('nunjucks');
const { resolve, dirname, isAbsolute } = require('path');
const debug = require('debug')('koa-nunjucks-next');

const filterWrapper = filter => {
	return (...args) => {
		let callback = args.pop();
		Promise.resolve(filter(...args)).then(
			val => callback(null, val),
			err => callback(err, null)
		);
	};
};

module.exports = function (root = 'views', option = {}) {
	if (typeof root === 'object') {
		option = root;
		root = option.root || 'views';
	}

	if (!isAbsolute(root)) {
		root = resolve(dirname(module.parent.filename), root);
	}

	const env = nunjucks.configure(root, option);

	let { extname = 'html', extensions = {}, filters = {}, globals = {} } = option;

  Object.keys(extensions).forEach(extensionKey => {
    env.addExtension(extensionKey, extensions[extensionKey]);
  });

	Object.keys(filters).forEach(filterKey => {
		env.addFilter(filterKey, filterWrapper(filters[filterKey]), true);
	});

	Object.keys(globals).forEach(globalKey => {
		env.addGlobal(globalKey, globals[globalKey]);
  });

	return (ctx, next) => {
		if (ctx.render) return next();

		ctx.render = (view, context = {}, isString = false) => {
			let method = isString ? 'renderString' : 'render';
      let template = isString ? view : `${view}.${extname}`;

      context = Object.assign({}, ctx.state, context);

			debug('render %s with %j', template, context);

			return new Promise((resolve, reject) => {
				env[method](template, context, (err, res) => {
					if (err) {
						return reject(err);
					}

					ctx.body = res;
					resolve();
				});
			});
		};

		return next();
	};
};
