'use strict';

const nunjucks = require('nunjucks');
const { resolve, dirname, isAbsolute } = require('path');
const debug = require('debug')('koa-nunjucks-next');

function filterWrapper(filter) {
  return async (...args) => {
    const callback = args.pop();
    try {
      const val = await Promise.resolve(filter(...args));
      callback(null, val);
    } catch (err) {
      callback(err);
    }
  };
}

module.exports = function(root = 'views', option = {}) {
  if (typeof root === 'object') {
    option = root;
    root = option.root || 'views';
  }

  if (!isAbsolute(root)) {
    root = resolve(dirname(module.parent.filename), root);
  }

  const env = nunjucks.configure(root, option);

  const { extname = 'html', extensions = {}, filters = {}, globals = {} } = option;

  Object.keys(extensions).forEach(key => {
    env.addExtension(key, extensions[key]);
  });

  Object.keys(filters).forEach(key => {
    env.addFilter(key, filterWrapper(filters[key]), true);
  });

  Object.keys(globals).forEach(key => {
    env.addGlobal(key, globals[key]);
  });

  return (ctx, next) => {
    if (ctx.render) return next();

    ctx.render = (view, context = {}, isString = false) => {
      const method = isString ? 'renderString' : 'render';
      const template = isString ? view : `${view}.${extname}`;

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
