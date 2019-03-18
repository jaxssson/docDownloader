const Doc = require('./Doc.js'),
	FileGenerator = require('./FileGenerator.js');

const cheerio = require('cheerio');

class Fetcher {
	constructor(url, msgTransmitter) {
		this.url = url;
		this.msgTransmitter = msgTransmitter;
		this.doc = new Doc(url, msgTransmitter);
		this.fileGenerator = new FileGenerator();
	}
	// 运行
	async run(index) {
		await this.doc.fetch();
		if (!this.doc.isErr) {
			this.msgTransmitter.transmit('stateChange', '正在拼接内容');
			const strArr = this.handleData(this.doc.content);
			this.msgTransmitter.transmit('stateChange', '内容拼接完成，正在生成txt');
			this.fileGenerator.writeTxt(index, strArr.join(''));
			this.msgTransmitter.transmit('success', '生成txt成功');
			return {
				index,	// 文件检索用
				title: this.doc.title,	// 下载的文件名
				url: this.url,	// 检查缓存用
			}
		}
		return 'error';
	}
	// 处理请求来的乱七八糟的数据
	handleData(dataArr) {
		// 将直接请求来的数据，处理成对象的形式，以便写入文件
		const objArr = dataArr.map(item => {
			return JSON.parse(
				item.slice(
					Array.prototype.findIndex.call(item, function (value, index, arr) {
						return value === '(';
					}) + 1, item.length - 1)
			);
		});
		// 将对象形式的数据拼接成字符串
		 return objArr.map(obj => {
			return obj.body.reduce((arr, word) => {
				if (word['t'] === 'word') {
					arr += word['c'];
				}
				return arr;
			},'');
		});
	}
}

module.exports = Fetcher;
