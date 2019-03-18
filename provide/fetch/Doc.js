const request = require('request-promise'),	// 支持promise的request包
	iconv = require('iconv-lite'),	// buffer转gb2312使用，不然乱码
	cheerio = require('cheerio');	// 将请求的string当做dom处理

const fs = require('fs');

class Doc {
	constructor(url, msgTransmitter) {

		this.msgTransmitter = msgTransmitter;

		this.outerUrl = url;
		this.outerHTML = '';

		this.contentURL = [];
		this.content = [];

		this.title = '';

		this.isErr = false;
		this.errMsg = '';

		this._init();
	}

	// 初始化
	_init() {
		// 检查文库url
		const isUrlValid = /wenku.baidu.com\/view\/\w+.html/.test(this.outerUrl);
		if (!isUrlValid) {
			this._setErrorMsg('url地址非法');
		}
	}

	// 设置错误信息
	_setErrorMsg(msg) {
		this.isErr = true;
		this.errMsg = msg;
		this.msgTransmitter.transmit('failure', msg);
	}

	// 从outerHTML中解析出contentUrl
	_parseContentUrl() {
		if (!/wkbjcloudbos\.bdimg\.com/.test(this.outerHTML)) {
			this._setErrorMsg('当前文档非word/excel内容或url有误');
			return;
		}
		const $ = cheerio.load(this.outerHTML);
		this.title = $('title').text();
		this.contentURL = $('script', '#hd').html().trim().replace(/\\x22|\\\\\\|\s/g, '').match(/pageLoadUrl:(.+?)0.json\?(.+?)}/g).map((url) => {
			return url.slice(0, url.length - 1).split('pageLoadUrl:')[1];
		});
		if (!this.contentURL.length) {
			this._setErrorMsg('抓取内容出错');
		}
		this.msgTransmitter.transmit('stateChange', `解析内页地址成功，共${this.contentURL.length}个内页`);
		// 获取内容url后，释放outerHTML
		this.outerHTML = null;
	}

	/**
	 * 获取content
	 * @returns {Promise<void>}
	 */
	async fetch() {
		if (!this.isErr) {
			await this.getOuterContent();
		}
		if (!this.isErr) {
			this._parseContentUrl();
		}
		if (!this.isErr) {
			const promises = [];
			this.contentURL.forEach((url) => {
				promises.push(this.getContent(url));
			});
			this.msgTransmitter.transmit('stateChange', '正在分别请求内页');
			const results = await Promise.all(promises);
			this.content = results;
			this.msgTransmitter.transmit('stateChange', '内页全部请求完成');
		}
	}

	/**
	 * * 获取包裹内容的文库外部页
	 * @param url 百度文库的url
	 * @returns {Promise<*>} 一个async函数
	 */
	async getOuterContent() {
		const that = this;
		const options = {
			uri: this.outerUrl,
			// 以buffer格式存在，在transform中进行编码
			encoding: null,
			// 设置为true，则需要在request header中设置一下Accept-Encoding
			gzip: true,
			headers: {
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
				// 如果带上下面这条http头，server端返回gzip格式
				'Accept-Encoding': 'gzip',
				'Accept-Language': 'zh-CN,zh;q=0.9',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
				'Host': 'wenku.baidu.com',
				'Pragma': 'no-cache',
				'Upgrade-Insecure-Requests': '1',
				'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36',
			},
			transform(body, res, resolveWithFullResponse) {
				// 查看response头中是否有编码信息，若没有，按默认'gb2312'对buffer进行编码
				const hasCharset = res.headers['content-type'].match(/(?:charset=)(\w+)/);
				const charset = hasCharset ? hasCharset[1] : 'gb2312';
				return iconv.decode(body, 'gb2312');
			}
		};
		return request(options)
			.then((body) => {
				that.outerHTML = body;
				that.msgTransmitter.transmit('stateChange', '获取外页成功');
			})
			.catch((err) => {
				that._setErrorMsg('请求外页失败');
			});
	}

	/**
	 * 异步获取单页内容
	 * @param url 每页的地址
	 * @returns {Promise<T>}
	 */
	async getContent(url) {
		return request(url)
			.then((body) => {
				return body;
			})
			.catch((err) => {
				this._setErrorMsg('请求内容失败');
			});
	}

}

module.exports = Doc;