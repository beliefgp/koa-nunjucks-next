'use strict';

const test = require('ava');
const supertest = require('supertest');
const Koa = require('koa');
const koaView = require('../');
const router = require('koa-router')();

router
	.get('/file-async', async (ctx, next) => {
		await ctx.render('async');
	})
	.get('/file-sync', async (ctx, next) => {
		await ctx.render('sync');
	})
	.get('/string-async', async (ctx, next) => {
		await ctx.render('{{ 1 | asyncAdd(10) }}', {}, true);
	})
	.get('/string-sync', async (ctx, next) => {
		await ctx.render('{{ 1 | syncAdd(10) }}', {}, true);
	});

const app = new Koa();
const request = supertest(app.listen(1234));

app.use(koaView('../views', {
	filters: {
		asyncAdd: async (val1, val2) => {
			return await new Promise((resolve, reject) => {
				setTimeout(() => { resolve(val1 + val2); }, 2000);
			});
		},
		syncAdd: (val1, val2) => {
			return val1 + val2;
		}
	}
}));

app.use(router.routes());

test.cb('file-async', t => {
	request
		.get('/file-async')
		.expect(200)
		.expect((res) => {
			if (res.text !== '11') {
				throw new Error('filter compute error ');
			}
		})
		.end(t.end);
});

test.cb('file-sync', t => {
	request
		.get('/file-sync')
		.expect(200)
		.expect((res) => {
			if (res.text !== '11') {
				throw new Error('filter compute error ');
			}
		})
		.end(t.end);
});

test.cb('string-async', t => {
	request
		.get('/string-async')
		.expect(200)
		.expect((res) => {
			if (res.text !== '11') {
				throw new Error('filter compute error ');
			}
		})
		.end(t.end);
});

test.cb('string-sync', t => {
	request
		.get('/file-sync')
		.expect(200)
		.expect((res) => {
			if (res.text !== '11') {
				throw new Error('filter compute error ');
			}
		})
		.end(t.end);
});
