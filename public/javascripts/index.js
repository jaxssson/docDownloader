const input = document.getElementById("input"),
	submit = document.getElementById("submit");

const downloadContent = document.getElementById("download-content"),
	downloader = document.getElementById("downloader"),
	txtTitle = document.getElementById("txt-title");

const messageContent = document.getElementById("message-content");

let socket;

submit.addEventListener('click', () => {
	messageContent.innerHTML = '';
	downloadContent.style.display = 'none';
	if (isUrlValid()) {
		socketConnect();
	}
	else{
		addMessage('url无效', 2);
	}
});

// 检测即将提交的url是否有效
function isUrlValid() {
	return /wenku.baidu.com\/view\/\w+.html/.test(input.value);
}

// 建立webSocket连接并发送url
function socketConnect() {
	socket = io.connect('http://localhost:3000');
	socket.on('connect', () => {
		addMessage('webSocket连接已建立');
		submit.disabled = 'disabled';
	});
	socket.on('disconnect', () => {
		addMessage('webSocket连接已断开');
		submit.disabled = '';
	});
	// 后台state变化
	socket.on('stateChange', data => {
		addMessage(data);
	});
	// 全部流程完成且成功
	socket.on('success', data => {
		addMessage(data, 1);
	});
	// 过程中失败
	socket.on('failure', data => {
		addMessage(data, 2);
	});
	// 收到文件信息
	socket.on('file', file => {
		if (file !== 'error') {
			addDownload(file);
		}
	});
	// 发送url
	socket.emit('url', input.value);
}

// 加入状态变化消息
function addMessage(msg, type) {
	const li = document.createElement('li');
	li.innerText = msg;
	messageContent.appendChild(li);
	if (type && +type === 2) {
		li.style.color = '#ff0000';
	}
	else if (type && +type === 1) {
		li.style.color = '#0000ff';
	}
}

// 加入下载
function addDownload(file) {
	downloadContent.style.display = 'block';
	downloader.download = file.title;
	downloader.href = `/file/${file.index}.txt`;
	txtTitle.innerText = file.title;
}