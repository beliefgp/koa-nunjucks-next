'use strict';

const nunjucks = require('nunjucks');
const { resolve, dirname, isAbsolute } = require('path');
const debug = require('debug')('koa-nunjucks-next');

const filterWrapper = filter => {
  return (...args) => {
    const callback = args.pop();
    Promise.resolve(filter(...args)).then(
      val => callback(null, val),
      err => callback(err, null)
    );
  };
};

const isAsyncFn = fn => {
  return fn && fn.constructor && [ 'GeneratorFunction', 'AsyncFunction' ].indexOf(fn.constructor.name) !== -1;
};

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

  Object.keys(extensions).forEach(extensionKey => {
    env.addExtension(extensionKey, extensions[extensionKey]);
  });

  Object.keys(filters).forEach(filterKey => {
    const filterFn = filters[filterKey];
    if (isAsyncFn(filterFn)) {
      env.addFilter(filterKey, filterWrapper(filterFn), true);
    } else {
      env.addFilter(filterKey, filterFn);
    }
  });

  Object.keys(globals).forEach(globalKey => {
    env.addGlobal(globalKey, globals[globalKey]);
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
