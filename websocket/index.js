const socketio = require('socket.io'),
	Fetcher = require('../provide/fetch/index.js');

// 缓存的最大文件数
const MAXFILENUM = 100;

class MsgTransmitter {
	constructor(socket) {
		this.socket = socket;
		this.title = '';
	}
	transmit(type, msg) {
		this.socket.emit(type, msg);
	}
}

// server端webSocket控制类
class SocketServer {
	constructor(server) {
		this.server = server;
		this.io = null;
		// 缓存的文件列表
		this.files = [];
		this.fileIndex = 0;
	}
	start() {
		const that = this;
		this.io = socketio.listen(this.server);
		this.io.sockets.on('connection', socket => {
			let url;
			let fetcher;
			let msgTransmitter = new MsgTransmitter(socket);
			socket.on('url', data => {
				socket.emit('stateChange', 'url已发送到server');
				url = data.replace(/\s+/g, '');
				// 先判断url在没在缓存中，如果在，直接返回
				let file;
				if (file = that.fileInCache(url)) {
					socket.emit('success', '文件已存在缓存，成功');
					that.closeSocket(socket, file);
				}
				// 如果不在缓存中，正常请求
				else {
					fetcher = new Fetcher(url, msgTransmitter);
					that.updateFileIndex();
					fetcher.run(that.fileIndex).then(data => {
						if (data !== 'error') {
							that.updateFiles(data);
						}
						that.closeSocket(socket, data);
					});
				}
			});
			socket.on('disconnect', function () {
				url = null;
				fetcher = null;
				msgTransmitter = null;
			});
		});
	}
	stop() {
		this.io.close();
		this.io = null;
	}
	// 维护files数组和fileIndex
	updateFiles(data) {
		this.files[data.index] = data;
	}
	// 维护fileIndex数组
	updateFileIndex() {
		this.fileIndex++;
		if (this.fileIndex >= MAXFILENUM) {
			this.fileIndex = 0;
		}
	}
	// 如果请求的地址在缓存中
	fileInCache(url) {
		for (let i = 0; i < this.files.length; i++) {
			if (this.files[i].url === url) {
				return this.files[i];
			}
		}
	}
	// 发送关于文件信息以及关闭客户端连接
	closeSocket(socket, file) {
		socket.emit('file', file);
		socket.disconnect(false);
	}
}

module.exports = SocketServer;

