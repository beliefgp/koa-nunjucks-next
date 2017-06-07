# koa-nunjucks-next

[koa2](https://github.com/koajs/koa) view render based on [nunjucks](http://mozilla.github.io/nunjucks), support asynchronous filters.

## Installation
```
npm install koa-nunjucks-next
```

## Warn

Do not use babel compile。

## API

#### `views(root, opts)`

* `root`: (default `views`) Views location. All views you `render()` are relative to this path.
* `opts` [nunjucks configure opts](http://mozilla.github.io/nunjucks/api.html#configure)
* `opts.globals`: nunjucks global values that will be available to all templates
* `opts.filters`: nunjucks filters, support asynchronous filter
* `opts.extensions`: nunjucks extensions (e.g. [highlight code blocks](https://github.com/ryanwild/nunjucks-highlight.js))

```js
filters: {
	asyncAdd1: (val1, val2) => {
		return new Promise((resolve, reject) => {
			setTimeout(() => resolve(val1 + val2), 2000);
		});
	},
	asyncAdd2: async (val1, val2) => {
		let val3 = await new Promise((resolve, reject) => {
			setTimeout(() => resolve(100), 1000);
		});

		return await new Promise((resolve, reject) => {
			setTimeout(() => resolve(val1 + val2 + val3), 2000);
		});
	},
	syncAdd: (val1, val2) => {
		return val1 + val2;
	}
}
```

* `opts.extname`: (default `html`) Extension for your views

```js
// instead of this
await ctx.render('test.html')
// you can
await ctx.render('test')
```

#### `ctx.render(template, content, [isStringTemplate])`

```js
// renders a template
await ctx.render('test', {})

// renders a raw string
await ctx.render('{{ val1 | asyncAdd1(1) }}', { val1: 66666 }, true)

```

## Example
```js
let views = require('koa-nunjucks-next');

app.use(views('../views', {
	filters: {
		asyncAdd: (val1, val2) => {
			return new Promise((resolve, reject) => {
				setTimeout(() => resolve(val1 + val2), 2000);
			});
		},
		syncAdd: (val1, val2) => {
			return val1 + val2;
		}
	}
}));

router.get('/test-template', async (ctx, next) => {
	await ctx.render('test', {
		'val1': 66666
	});
});

router.get('/test-string', async (ctx, next) => {
	await ctx.render('{{ val1 | asyncAdd(1) }}', {
		'val1': 66666
	}, true);
}); //==> 66667

```
