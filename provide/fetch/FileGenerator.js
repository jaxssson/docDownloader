const fs = require('fs'),
	path = require('path');

// 文件输出路径
let FILEROOT;
if (process.env.NODE_ENV === 'development') {
	FILEROOT = path.resolve(__dirname + './../../public/file');
}
else {
	FILEROOT = path.resolve(__dirname + './../../dist/file');
}

class FileGenerator {
	constructor() {}

	/**
	 * 异步将数据写成txt文件
	 * @param title	文库文章的title，用作文件名
	 * @param data	文档内容
	 * @returns {Promise<any>}
	 */
	async writeTxt(title, data) {
		return new Promise(function (resolve, reject) {
			const writeOptions = {
				encoding: 'utf8',
				flag: 'w',
			};
			fs.writeFileSync(path.resolve(FILEROOT, `${title}.txt`), data, writeOptions, () => {
				resolve();
			});
		});

	}
}

module.exports = FileGenerator;