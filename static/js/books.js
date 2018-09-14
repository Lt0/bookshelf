/**
* Created by hepeiqin on 2018/1/18.
*/

var BList;
var Here;
var Hist = {
	visitedIds: new Array(),
	curIndex: -1,
}

var showRMenuBy = ""; // 右键菜单的触发者，bookTree, center

// for copy and move
var FileCache = {
	type: null, // type: "copy", "move", null
	oldName: "",
	oldPath: "",
}

var ViewMode = "icons"; //support mode: icons/details, default: icons

$(document).ready(initMainPage);

function initMainPage(){
	console.log("initMainPage");

	//customize scrollbar
	var Scrollbar = window.Scrollbar;
	Scrollbar.init(document.querySelector("#search-list-box"));
	Scrollbar.init(document.querySelector("#book-tree"));
	Scrollbar.init(document.querySelector("#book-list-container"));
	Scrollbar.init(document.querySelector("#dir-details-layer"));
	Scrollbar.init(document.querySelector("#book-details-layer"));
	Scrollbar.init(document.querySelector("#upload-task-list-container"));
	Scrollbar.init(document.querySelector("#upload-new-task-list-container"));

	//init login icon and binding event
	console.log("initLoginIcon");
	isLogin(showUserBtn);

	$("#left").resizable();
	$("#upload-task-container").resizable({
		handles: "w",
		minWidth: 550,
		maxWidth: 1100,
	});

	centerRMenuInit();
	initViewMode();
	initShortcutKey();
	initFullScreen();
}

function initViewMode(){
	savedMode = localStorage.getItem("ViewMode");
	if (savedMode) {
		ViewMode = savedMode;
		if (ViewMode == "details") {
			$("#book-list-details-mode-head").show();
		}
	}
}

function initShortcutKey(){
	console.log("initShortcutKey");
	$("#search-input").bind("keydown", searchInputShortCutKey);
	$("#center").bind("keydown", centerShortCutKey);
	$("#bookTree").bind("keydown", BTreeShortCutKey);
	$("body").bind("keydown", bodyShortCutKey);
}
//unset all shortcut key
function unsetAllSK(){
	console.log("unsetAllSK");
	$("#center").unbind("keydown", centerShortCutKey);
	$("#bookTree").unbind("keydown", BTreeShortCutKey);
	$("body").unbind("keydown", bodyShortCutKey);
}

function fullScreen(){
	var fullEl = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
	if (fullEl) {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if(document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if(document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		}
		return;
	}

	var bd = document.getElementsByTagName("body")[0];
	//var bd = document.getElementById("mainpage");
	if(bd.requestFullscreen) {
		bd.requestFullscreen();
	} else if(bd.mozRequestFullScreen) {
		bd.mozRequestFullScreen();
	} else if(bd.msRequestFullscreen){
		bd.msRequestFullscreen();
	} else if(bd.webkitRequestFullscreen) {
		bd.webkitRequestFullScreen();
	}
}

function initFullScreen(){
	console.log("initFullScreen");
	// 全屏变化事件是全屏事件处理之后触发的
	$(document).bind('fullscreenchange webkitfullscreenchange mozfullscreenchange', function(){
		console.log('全屏事件');
		var fullEl = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
		var icon = $("#full-screen-btn").children();
		if (fullEl) {
			// 进入全屏
			if (icon.hasClass("glyphicon-resize-full")){
				icon.removeClass("glyphicon-resize-full").addClass("glyphicon-resize-small");
			}
		} else {
			// 退出全屏
			if (icon.hasClass("glyphicon-resize-small")){
				icon.removeClass("glyphicon-resize-small").addClass("glyphicon-resize-full");
			}
		}
	});
}

function showHomeInfo(){
	console.log("showHomeInfo");

	m = $("#homeInfoModal");
	if (m.length > 0) {
		m.modal("show");
		return;
	}

	var m = new modalPage("homeInfoModal", "Personal BookShelf");
	m.Btn.remove();

	var infoContent = $("<div></div>").addClass("home-info-modal");

	var qrc = $("<div></div>");
	var url = location.protocol + "//" + location.hostname + ":" + location.port;
	qrc.qrcode({
		width: 150,
		height: 150,
		text: url,
	});
	infoContent.append(qrc);
	
	var info = $("<div></div>").addClass("home-info-modal-info");

	var comment = "<p>em...</p>";
	comment += "<p>这是个完全开源的书架应用，纯练手项目</p>";
	comment += '<p>项目主页: <a href="https://github.com/Lt0/bookshelf" target="_blank" style="word-break: break-all">https://github.com/Lt0/bookshelf</a></p>';
	comment += '<p>扫描二维码可以打开当前主页</p>';
	info.append($(comment));

	infoContent.append(info);
	m.body.append(infoContent);
	m.body.addClass("home-info-modal-container");
	m.show();
}

function loadBookTree(){
	Here = new Vue({
		el: '#book-list',
		data: {
			hist: Hist,
		},
		computed: {
			booksHTML: function(){
				//console.log("gen message: " + this.hist.visitedIds);
				curId = this.hist.visitedIds[this.hist.curIndex];
				console.log("gen message: curId: " + curId);
				updatePathNavById(curId);
				return genBookListHTML(curId);
			}
		}
	})

	//zTree setting
	var setting = {
		data: {
			simpleData: {
				enable: true
			}
		},
		callback:{
			beforeClick: beforeClick,
			onClick: onClick,
			beforeDblClick: beforeDblClick,
			onDblClick: onDblClick,
			onRightClick: onRightClick,
			beforeExpand: beforeExpand,
			onExpand: onExpand,
			onAsyncSuccess: onAsyncSuccess,
		},
		async: {
			enable: true,
			url:"/api/books/getBooksDirCatalog",
			autoParam: ["id=path"],
			contentType:'application/json',
			dataType:'text',
			type:'post',
			dataFilter:null
		},
		view: {
			showLine: false,
		},
		edit: {
			editNameSelectAll: true,
		}
	};

	var loadIndex = showGlobalLoading();
	$.post("/api/books/getBooksDirCatalog", null, function(data, status){
		closeGlobalLoading(loadIndex);
		if (status == "success") {
			BList = $.fn.zTree.init($("#bookTree"), setting, data);
			expandRoot();
			updateHistOverride(zTreeGetRootNode(BList));

		} else {
			showAlert("Get Book Root Index failed: " + status);
		}

	});
}

function expandRoot() {
	nodes = BList.getNodes();
	node = nodes[0];
	if (nodes.length>0) {
		BList.expandNode(node, true, false, true, false);
	}
}

function beforeClick(treeId, treeNode, clickFlag) {
}

function beforeDblClick(treeId, treeNode, clickFlag) {
	if (treeNode && treeNode.bookInfo.IsBook) {
		openBook(treeNode)
	}
}

function onClick(event, treeId, treeNode, clickFlag) {
	curNodes = BList.getSelectedNodes();
	curNode = curNodes[0];
	if (treeNode.isParent && treeNode.open) {
		updateHistOverride(treeNode);
	} else {
		p = treeNode.getParentNode();
		updateHistOverride(p);
	}

	if (treeNode.bookInfo.IsBook) {
		//showBookInfo(treeNode);
		BList.selectNode(treeNode);
	}

	//select item in book-list
	if (treeNode.isParent) {
		//hideBookInfo();
		id = "dir-" + treeNode.id;
	} else {
		id = "book-" + treeNode.id;
		BList.selectNode(treeNode);
	}
	ele = document.getElementById(id)
	selectBookListItem(ele);
}

function onDblClick(event, treeId, treeNode, clickFlag) {

}

var expandLoadingIndex;
function beforeExpand(event, treeId, treeNode) {
	console.log("beforeExpand");
	//updateHistOverride(treeNode);
	expandLoadingIndex = showGlobalLoading();
}
function onExpand(event, treeId, treeNode){
	console.log("onExpand");
	closeGlobalLoading(expandLoadingIndex);
	if (treeNode.isParent && Hist.visitedIds[Hist.curIndex] == treeNode.id) {
		console.log("expanding current book list, return without update Hist");
		return;
	}
	updateHistOverride(treeNode);
	BList.selectNode(treeNode);
}

function onRightClick(event, treeId, treeNode){
	BList.selectNode(treeNode);
	showRMenu("node", event.clientX, event.clientY);
}


//right menu for book-tree area
function showRMenu(type, x, y){
	showRMenuBy = "bookTree";
	filtRMenuItem();

	menu = $("#BTreeRMenu");

	y += document.body.scrollTop;
    x += document.body.scrollLeft;

	//adjust y
	left = $("#left")
	menuBottom = y + menu.height();
	leftBottom = left.offset().top + left.height();
	if (menuBottom > leftBottom) {
		y -= menu.height();
	}

    menu.css({"top":y+"px", "left":x+"px"});
    menu.show();

	$("body").bind("mousedown", onRMenuBodyMouseDown);
}

function hideRMenu() {
	menu = $("#BTreeRMenu")
	if (menu) {
		//menu.css({"visibility": "hidden"}) ;
		menu.hide();
	}
	$("body").unbind("mousedown", onRMenuBodyMouseDown);
}

function onRMenuBodyMouseDown(event){
	menu = $("#BTreeRMenu");
	if (!(event.target.id == "BTreeRMenu" || $(event.target).parents("#BTreeRMenu").length > 0)) {
		menu.hide();
	}
}

function filtRMenuItem(){
	console.log("filtRMenuItem");

	node = BList.getSelectedNodes()[0];
	//console.log("filtRMenuItem: node.id" + node.id);
	
	var add = $("#book-tree-rmenu-add");
	var upload = $("#book-tree-rmenu-upload");
	var download = $("#book-tree-rmenu-download");
	var refresh = $("#book-tree-rmenu-refresh");
	var copy = $("#book-tree-rmenu-copy");
	var cut = $("#book-tree-rmenu-move");
	var paste = $("#book-tree-rmenu-paste");
	var remove = $("#book-tree-rmenu-remove");
	var rename = $("#book-tree-rmenu-rename");
	var newDir = $("#book-tree-rmenu-newdir");
	//var details = $("#book-tree-rmenu-details"); //always show

	if (node.isParent) {
		add.show();
		upload.show();
		download.hide();
		refresh.show();
		copy.show();
		cut.show();
		if (FileCache.type) {
			paste.show();
		} else {
			paste.hide();
		}

		remove.show();
		rename.show();
		newDir.show();
	} else {
		add.hide();
		upload.hide();

		//Not support download dir
		if (supportDownloadBook(node)) {
			download.show();
		} else {
			download.hide();
		}

		refresh.hide();
		copy.show();
		cut.show();
		paste.hide();
		remove.show();
		rename.show();
		newDir.hide();
	}
}

function clickRefresh(){
	console.log("clickRefresh");
	$("#BTreeRMenu").hide();

	if (showRMenuBy == "bookTree") {
		node = BList.getSelectedNodes()[0];
	} else if (showRMenuBy == "center") {
		var id = Hist.visitedIds[Hist.curIndex];
		node = BList.getNodeByParam("id", id);
	} else {
		showAlert("clickDownload: 未知的右键菜单显示区域");
		return;
	}
	refreshNode(BList, node);
}

function clickCopy(){
	$("#BTreeRMenu").hide();

	if (showRMenuBy == "bookTree") {
		var node = BList.getSelectedNodes()[0];
		if (!node) {
			console.log("could not get selected node");
			return;
		}
	} else if (showRMenuBy == "center") {
		var node = centerRMenuGetTargetNode();
	} else {
		showAlert("clickDownload: 未知的右键菜单显示区域");
		return;
	}
	

	FileCache.type = "copy";
	FileCache.oldName = node.name;
	FileCache.oldPath = node.id;
}

//ctrl+x, cut
function CutByCSK(ev){
	//console.log("CutByCSK");
	if (!seBLItem) {
		return;
	}

	var node = getNodeByCurCenterElem();
	if (!node) {
		showAlert("无法获取当前要剪切的文件", "出错", 5);
		return;
	}
	FileCache.type = "move";
	FileCache.oldName = node.name;
	FileCache.oldPath = node.id;
	console.log("CutByCSK: cut: " + node.name);
}

function CutByTSK(ev){
	//console.log("CutByTSK");
	var node = BList.getSelectedNodes()[0];
	if (!node) {
		console.log("could not get selected node");
		return;
	}
	FileCache.type = "move";
	FileCache.oldName = node.name;
	FileCache.oldPath = node.id;
	console.log("CutByTSK: cut: " + node.name);
}

function CopyByCSK(){
	//console.log("CopyByCSK");
	if (!seBLItem) {
		return;
	}

	var node = getNodeByCurCenterElem();
	if (!node) {
		showAlert("无法获取当前要剪切的文件", "出错", 5);
		return;
	}
	FileCache.type = "copy";
	FileCache.oldName = node.name;
	FileCache.oldPath = node.id;
	console.log("CopyByCSK: copied: " + node.name);
}

function CopyByTSK(){
	//console.log("CopyByCSK");
	var node = BList.getSelectedNodes()[0];
	if (!node) {
		console.log("could not get selected node");
		return;
	}
	FileCache.type = "copy";
	FileCache.oldName = node.name;
	FileCache.oldPath = node.id;
	console.log("CopyByTSK: copied: " + node.name);
}

function pasteBySK(ev){
	console.log("pasteBySK");
	if (!FileCache.oldPath) {
		return;
	}
	var node = BList.getNodeByParam("id", Hist.visitedIds[Hist.curIndex]);
	if (!node) {
		showAlert("无法获取当前位置", "粘贴出错", 5);
		return;
	}

	var oldPath = FileCache.oldPath;
	var newPath = node.id + "/" + FileCache.oldName;

	oldPath = cleanPath(oldPath);
	newPath = cleanPath(newPath);
	if (oldPath == newPath) {
		showAlert("文件已存在");
		return;
	}

	if (FileCache.type == "copy") {
		pasteForCopy(node, oldPath, newPath);
	} else {
		var srcNode = BList.getNodeByParam("id", FileCache.oldPath);
		pasteForMove(srcNode, node, oldPath, newPath);
	}
}


function clickMove(){
	$("#BTreeRMenu").hide();

	if (showRMenuBy == "bookTree") {
		var node = BList.getSelectedNodes()[0];
		if (!node) {
			console.log("could not get selected node");
			return;
		}
	} else if (showRMenuBy == "center") {
		var node = centerRMenuGetTargetNode();
	} else {
		showAlert("clickDownload: 未知的右键菜单显示区域");
		return;
	}

	FileCache.type = "move";
	FileCache.oldName = node.name;
	FileCache.oldPath = node.id;
}

function clickPaste(){
	$("#BTreeRMenu").hide();

	if (showRMenuBy == "bookTree") {
		var node = BList.getSelectedNodes()[0];
		if (!node) {
			console.log("could not get selected node");
			return;
		}
	} else if (showRMenuBy == "center") {
		if (seBLItem.attr("id")) {
			var node = centerRMenuGetTargetNode();
		} else {
			var node = BList.getNodeByParam("id", Hist.visitedIds[Hist.curIndex]);
		}
	} else {
		showAlert("clickDownload: 未知的右键菜单显示区域");
		return;
	}



	srcNode = BList.getNodeByParam("id", FileCache.oldPath);

	oldPath = FileCache.oldPath;
	newPath = node.id + "/" + FileCache.oldName;
	
	oldPath = cleanPath(oldPath);
	newPath = cleanPath(newPath);
	if (oldPath == newPath) {
		showAlert("文件已存在");
		return;
	}

	if (FileCache.type == "copy") {
		pasteForCopy(node, oldPath, newPath);
	} else {
		pasteForMove(srcNode, node, oldPath, newPath);
	}
}

function pasteForCopy(dstNode, oldPath, newPath){
	console.log("copy " + oldPath + " to " + newPath);
	var loadIndex = showGlobalLoading();
	url = "/api/booksMgmt/copy";
	$.get(url, {"oldPath": oldPath, "newPath": newPath}, function(data, status){
		closeGlobalLoading(loadIndex);
		if (status == "success") {
			console.log("pasteForCopy: data: " + data);
			if (!data) {
				console.log("copy success data: " + data);
				refreshNode(BList, dstNode);
			} else {
				showAlert("复制失败： " + data, "复制结果", 5);
			}
		} else {
			showAlert("连接服务器失败: " + status);
		}
	});
}

function pasteForMove(srcNode, dstNode, oldPath, newPath){
	console.log("move " + oldPath + " to " + newPath);
	var loadIndex = showGlobalLoading();
	url = "/api/booksMgmt/rename";
	$.get(url, {"oldPath": oldPath, "newPath": newPath}, function(data, status){
		closeGlobalLoading(loadIndex);
		if (status == "success") {
			if (data == null) {
				console.log("move success data: " + data);
				clearFileCache();
				srcPNode = srcNode.getParentNode();
				refreshNodes(BList, [srcPNode, dstNode]);
			} else {
				showAlert("移动失败： " + data);
			}
		} else {
			showAlert("连接服务器失败: " + status);
		}
	});
}

function clearFileCache(){
	FileCache.type = null;
	FileCache.oldPath = "";
}

function resetAddBookModal(){
	$("#addBookModalBtn").html("添加");
	$("#addBookModalBookName").attr("placeholder", "书名，网站或 gitbook 或链接必须填写，单文件可忽略");
	$("#addBookModalBookUrl").attr("placeholder", "下载链接");;
}
function clickGoAdd(){
	$("#BTreeRMenu").hide();
	var a = $("#addBookModal");
	if (a.length > 0) {
		resetAddBookModal();
		a.modal("show");
		return;
	}

	var a = new modalPage("addBookModal", "添加书籍");
	a.Btn.attr("id", "addBookModalBtn");
	a.Btn.html("添加");
	a.Btn.click(function(){
		clickAdd(a);
	});

	var content = $("<div></div>");

	var inputForm = $("<form id=\"addForm\"></form>");

	var type = $("<div></div>")
	var isNorBook = '<label class="radio-inline" title="远程下载单个文件到服务器"><input type="radio" name="BType" value="normal" checked>单文件</label>';
	var isWebBook = '<label class="radio-inline" title="远程下载整个网站到服务器"><input type="radio" name="BType" value="webBook">网站或 gitbook</label>';
	var isLink = '<label class="radio-inline" title="仅添加网页连接，不实际下载任何文件"><input type="radio" name="BType" value="link">链接</label>';
	type.append(isNorBook, isWebBook, isLink);
	inputForm.append(type);

	var urlDiv = $("<div></div>");
	var bookName = '<br><label for="addBookModalBookName">书名</label><input id="addBookModalBookName" type="text" class="form-control" placeholder="书名，网站或 gitbook 或链接必须填写，单文件可忽略">';
	var bookUrl = '<br><label for="addBookModalBookUrl">下载地址</label><textarea id="addBookModalBookUrl" class="form-control" rows="3" placeholder="下载链接"></textarea>';
	
	urlDiv.append(bookName, bookUrl);
	inputForm.append(urlDiv);

	content.append(inputForm);
	a.body.append(content);

	a.dialog.on('shown.bs.modal', function(e) {
		$("#addBookModalBookUrl").focus();
	});
	a.show();

}

function clickAdd(addPage){
	console.log("clickAdd");

	// get save path
	var bookPath;
	if (showRMenuBy == "bookTree") {
		console.log("clickAdd: from book tree");
		node = BList.getSelectedNodes()[0];
		if (node) {
			bookPath = node.id;
		} else {
			showAlert("无法获取当前路径");
			return;
		}
	} else if (showRMenuBy == "center") {
		if (seBLItem.attr("id")) {
			bookPath = centerRMenuGetTargetId();
		} else {
			bookPath = Hist.visitedIds[Hist.curIndex];
		}
	} else {
		console.log("clickAdd: unknow");
		showAlert("无法获取当前路径")
		return;
	}
	console.log("clickAdd: bookPath: " + bookPath);

	//get type
	var fo = document.getElementById("addForm");
	var bookType;
	for (var i = 0; i < fo.length; i++) {
		f = fo.elements[i];
		if (f.checked) {
			bookType = f.value;
		}
	}
	console.log("clickAdd: bookType: " + bookType);

	var bookName = $("#addBookModalBookName").val();
	console.log("clickAdd: bookName: " + bookName);

	// get book url
	var bookUrl = $("#addBookModalBookUrl").val();
	if (bookUrl == "") {
		bu = $("#addBookModalBookUrl");
		bu.attr("placeholder", "网址不能为空");
		return;
	}
	if (bookType == "link") {
		if (bookUrl.substr(0, 7) != "http://" && bookUrl.substr(0, 8) != "https://") {
			bookUrl = "http://" + bookUrl;
		}
	}
	console.log("clickAdd: bookUrl: " + bookUrl);

	if (bookType != "normal" && bookName == "") {
		var bn = $("#addBookModalBookName");
		bn.attr("placeholder", bookType + " 类不能没有书名");
		return;
	}

	var addUrl = "/api/booksMgmt/add";
	var param = {
		path: bookPath,
		BUrl: bookUrl,
		BName: bookName,
		BType: bookType,
	}

	$.post(addUrl, param, function(data, status){
		addPage.hide(); 
		layer.close(loadIndex);
		if (status != "success") {
			data = ("连接服务器出错： " + status);
		} else {
			if (data == "" || (bookType == "webBook" && data == "exit status 8\n")) {
				data = "success";
				ico = 1;
			} else {
				ico = 5;
			}
		}
		showAlert(data, "添加结果", ico);
		var node = BList.getNodeByParam("id", bookPath);
		refreshNode(BList, node);
	});

	addPage.Btn.html("正在添加...");
	loadIndex = layer.load(0, {shade: false});
}

function clickGoUpload(path){
	console.log("clickGoUpload");

	// 重置 覆盖已有文件 的 checkbox 状态
	uov = document.getElementById("upload-override-all");
	uov.checked = false;

	if (path) {
		console.log("upload to: " + path);
		UploadCxt.taskEntry = path;
	} else {
		//设置上传目的路径，即显示右键菜单时所点击的目录
		UploadCxt.taskEntry = "";
		if (showRMenuBy == "bookTree") {
			console.log("clickGoUpload: from book tree");
			node = BList.getSelectedNodes()[0];
			if (node) {
				UploadCxt.taskEntry = node.id;
			}
		} else if (showRMenuBy == "center") {
			if (seBLItem.attr("id")) {
				UploadCxt.taskEntry = centerRMenuGetTargetId();
			} else {
				UploadCxt.taskEntry = Hist.visitedIds[Hist.curIndex];
			}
		} else {
			console.log("clickGoUpload: unknow");
			showAlert("无法获取上传路径")
			return;
		}
	}

	if (UploadCxt.taskEntry == ".") {
		$("#upload-modal-path").html("  (到: 根目录)");
	} else {
		$("#upload-modal-path").html("  (到: " + UploadCxt.taskEntry + ")");
	}
	

	$("#BTreeRMenu").hide();

	var um = $("#upload-modal");
	um.on('show.bs.modal', function (e) {unsetAllSK()});
	um.on('hide.bs.modal', function (e) {initShortcutKey();});
	um.modal('show');

	clearUploadNewTaskList();
	uploadNewListRefreshList();
	uploadNewListViewRefreshCount();
}

// 右键菜单下载功能
function clickDownload(){
	console.log("clickDownload");

	$("#BTreeRMenu").hide();

	if (showRMenuBy == "bookTree") {
		var node = BList.getSelectedNodes()[0];
		if (!node) {
			console.log("no selected node");
			return;
		}
	} else if (showRMenuBy == "center") {
		var node = centerRMenuGetTargetNode();
	} else {
		showAlert("clickDownload: 未知的右键菜单显示区域");
		return;
	}
	

	url = genDownloadUrl(node);
	console.log(url);
	if (url) {
		download(url, node.name);
	}
}

function download(url, name){
	var a = document.createElement('a');
	a.href = url;
	a.download = name;

	//append to body to trigger download in firefox
	document.body.appendChild(a);
	
	a.click();
	document.body.removeChild(a);
}

// remove by center shortcut key
function removeByCSK(ev){
	console.log("removeByCSK");
	if (!seBLItem) {
		console.log("removeByCSK: no select item");
		return;
	}

	var node = getNodeByCurCenterElem();
	if (!node) {
		console.log("removeByCSK: get cur node failed");
		return;
	}

	if (zTreeIsRootNode(BList, node)) {
		showAlert("不能删除根目录");
		return;		
	}

	console.log("removeByCSK: removing " + node.id);
	var pnode = node.getParentNode();

	booksMgmtRemove(node.id, refreshNode, [BList, pnode]);
}

// remove by book tree shortcut key
function removeByTSK(ev){
	console.log("removeByTSK");

	var node = BList.getSelectedNodes()[0];
	if (!node) {
		console.log("removeByTSK: get cur node failed");
		return;
	}

	if (zTreeIsRootNode(BList, node)) {
		showAlert("不能删除根目录");
		return;		
	}

	console.log("removeByTSK: removing " + node.id);
	var pnode = node.getParentNode();

	booksMgmtRemove(node.id, refreshNode, [BList, pnode]);
}

function clickRemove(){
	console.log("clickRemove");
	$("#BTreeRMenu").hide();

	if (showRMenuBy == "bookTree") {
		var node = BList.getSelectedNodes()[0];
		if (!node) {
			console.log("no selected node");
			return;
		}
	} else if (showRMenuBy == "center") {
		var node = centerRMenuGetTargetNode();
	} else {
		showAlert("clickDownload: 未知的右键菜单显示区域");
		return;
	}

	if (zTreeIsRootNode(BList, node)) {
		showAlert("不能删除根目录");
		return;		
	}
	console.log("clickRemove: removing " + node.id);
	var pnode = node.getParentNode();
/*
	url = "/api/booksMgmt/delete";
	$.get(url, {"path": node.id}, function(data, status){
		if (status == "success") {
			console.log("clickRemove: GET success data: " + data);
			if (data == null) {
				console.log("remove success");
			} else {
				showAlert("删除失败: " + data);
			}
		} else {
			console.log("clickRemove: GET failed data: " + data);
			showAlert("连接服务器出错: " + status);
		}
		refreshNode(BList, pnode);
	});
*/
	booksMgmtRemove(node.id, refreshNode, [BList, pnode]);
}

// fn 是执行完移除后的调用， fnArgs 是传递给 fn 的参数，形式为 [arg0, arg1, ...]
function booksMgmtRemove(path, fn, fnArgs){
	console.log("booksMgmtRemove: confirm!");
	var msg = "彻底删除: " + path + " ?";
	var cfmIndex = layer.confirm(msg, {
		btn: ["确定", "取消"], //按钮
		icon: 2, 
		title:'删除确认',
	}, function(){
		layer.close(cfmIndex);
		booksMgmtRemoveRun(path, fn, fnArgs);
	}, function(){
	});
}
function booksMgmtRemoveRun(path, fn, fnArgs){
	if (!path) {
		console.log("booksMgmtRemove: err: no path");
		return;
	}
	var loadIndex = showGlobalLoading();
	url = "/api/booksMgmt/delete";
	$.get(url, {"path": path}, function(data, status){
		closeGlobalLoading(loadIndex);
		if (status == "success") {
			console.log("booksMgmtRemove: GET success data: " + data);
			if (data == null) {
				console.log("booksMgmtRemove: remove success");
			} else {
				showAlert("删除失败: " + data);
			}
		} else {
			console.log("booksMgmtRemove: GET failed data: " + data);
			showAlert("连接服务器出错: " + status);
		}
		if (typeof fn === "function") {
			fn.apply(this, fnArgs);
		}
	});
	
	/*
	$.ajax({
		"url": url,
		data: {"path": path},
		type: "GET",
		async: false,
		success: function(data, status){
			console.log("booksMgmtRemove: GET success data: " + data);
			if (data == null) {
				console.log("booksMgmtRemove: remove success");
			} else {
				showAlert("删除失败: " + data);
			}
		},
		error: function(data, status){
			console.log("booksMgmtRemove: GET failed data: " + data);
			showAlert("连接服务器出错: " + status);
		},
		complete: function(){
			if (typeof fn === "function") {
				fn.apply(this, fnArgs);
			}
		}
	});
	*/
}

function clickNewDir(){
	console.log("clickNewDir");

	$("#BTreeRMenu").hide();

	var node;
	if (showRMenuBy == "bookTree") {
		node = BList.getSelectedNodes()[0];
	} else if (showRMenuBy == "center") {
		node = centerRMenuGetTargetNode();
	} else {
		showAlert("clickDownload: 未知的右键菜单显示区域");
		return;
	}

	if (!node) {
		showAlert("无法获取当前路径");
		return;
	}

	var newNode = zTreeUniqNode(BList, node, true);
	if (!newNode) {
		console.log("clickNewDir: create new node failed");
		return;
	}

	if (showRMenuBy == "bookTree") {
		newNode = BList.addNodes(node, newNode);
		BList.setting.callback.onRename = onNewDirRename;
		BList.editName(newNode[0]);
	} else {
		newDir(newNode.id);
	}
}

function onNewDirRename(event, treeId, treeNode, isCancel){
	console.log("rename finish");

	treeNode.id = treeNode.getParentNode().id + "/" + treeNode.name;
	console.log("treeNode.id: " + treeNode.id);

	var loadIndex = showGlobalLoading();
	url = "/api/booksMgmt/newdir"
	$.get(url, {"path": treeNode.id}, function(data, status) {
		closeGlobalLoading(loadIndex);
		BList.setting.callback.onRename = null;
		if (status == "success") {
			console.log("onRename: GET success data: " + data);
			if (data != null) {
				console.log("create dir failed");
			} else {
				console.log("create dir success");
				refreshBookList();
				return;
			}
		} else {
			console.log("onRename: GET failed data: " + data);
		}
		console.log("show err info and delete new node in book-tree");
		showAlert("创建失败：" + data);
		BList.removeNode(treeNode);
	});
}

function newDir(path){
	console.log("newDir: path: " + path);
	var loadIndex = showGlobalLoading();
	url = "/api/booksMgmt/newdir";
	$.get(url, {"path": path}, function(data, status) {
		closeGlobalLoading(loadIndex);
		if (status == "success") {
			console.log("newDir: GET success data: " + data);
			if (data != null) {
				console.log("create dir failed");
			} else {
				console.log("create dir success");
				refreshBookList();
				pId = path.substr(0, path.lastIndexOf("/"));
				if (pId.length == 0) {
					refreshNode(BList, zTreeGetRootNode(BList));
				} else {
					refreshNode(BList, BList.getNodeByParam("id", pId));
				}
				return;
			}
		} else {
			console.log("newDir: GET failed data: " + data);
		}
		console.log("show err info and delete new node in book-tree");
		showAlert("创建失败：" + data);
	});
}

// work on book-tree/center rename

//rename by book tree shortcut key
function RenameByTSK(ev){
	node = BList.getSelectedNodes()[0];
	if (!node) {
		showAlert("Error: clickRename: get node failed");
		return null;
	}

	if (zTreeIsRootNode(BList, node)) {
		showAlert("不能重命名根目录");
		return;
	}

	BList.setting.callback.onRename = clickRenameCallback;
	BList.editName(node);
}
//rename by center shortcut key
function RenameByCSK(ev){
	console.log("RenameByCSK");
	if (!seBLItem) {
		return;
	}

	centerRMenuRename();
}
function clickRenameGetNode(){
	if (showRMenuBy == "bookTree") {
		node = BList.getSelectedNodes()[0];
	} else if (showRMenuBy == "center") {
		node = centerRMenuGetTargetNode();
	} else {
		showAlert("clickRename: 未知的右键菜单显示区域");
		return;
	}

	if (!node) {
		showAlert("Error: clickRename: get node failed");
		return null;
	}

	return node
}
function clickRename(node){
	console.log("clickRename");

	$("#BTreeRMenu").hide();
	var node = clickRenameGetNode();
	if (!node) {
		showAlert("Error: clickRename: get node failed");
		return null;
	}

	if (zTreeIsRootNode(BList, node)) {
		showAlert("不能重命名根目录");
		return;
	}

	if (showRMenuBy == "bookTree") {
		$("#bookTree").unbind("keydown", BTreeShortCutKey);
		BList.setting.callback.onRename = clickRenameCallback;
		BList.editName(node);
	} else if (showRMenuBy == "center") {
		centerRMenuRename();
	} else {
		showAlert("clickRename: 未知的右键菜单显示区域");
		return;
	}
}

function clickRenameCallback(event, treeId, treeNode, isCancel){
	console.log("clickRenameCallback");
	$("#bookTree").bind("keydown", BTreeShortCutKey);
	renameNode(treeNode);
}

function renameNode(node){
	url = "/api/booksMgmt/rename";
	pNode = node.getParentNode();
	loadIndex = showGlobalLoading();
	$.get(url, {"oldPath": node.id, "newPath": pNode.id+"/"+node.name}, function(data, status){
		closeGlobalLoading(loadIndex);
		BList.setting.callback.onRename = null;
		if (status == "success") {
			console.log("clickRenameCallback: GET success data: " + data);
			if (data == null) {
				console.log("clickRenameCallback: rename success");
			} else {
				console.log("clickRenameCallback: rename failed");
				showAlert("rename failed: " + data);
			}
		} else {
			console.log("clickRenameCallback: GET failed status: " + status);
			showAlert("rename failed: " + status);
		}

		refreshNode(BList, pNode);
	});
}
// work on book-tree rename end

function clickDetails(){
	console.log("clickDetails");
	$("#BTreeRMenu").hide();
	if (showRMenuBy == "bookTree") {
		node = BList.getSelectedNodes()[0];
	} else if (showRMenuBy == "center") {
		node = centerRMenuGetTargetNode();
	} else {
		showAlert("clickRename: 未知的右键菜单显示区域");
		return;
	}

	if (node.bookInfo.IsBook) {
		showBookInfo(node);
	} else {
		showDirInfo(node);
	}
}


//return a uniqNode to create a new dir/file in node.
function zTreeUniqNode(tree, node, isParent){
	var uniqNode = new Object();

	uniqNode.isParent = isParent;
	if (isParent) {
		name = "new folder";
	} else {
		name = "new file"
	}

	uniqNode.name = name;

	if (zTreeIsRootNode(BList, node)) {
		uniqNode.id = uniqNode.name;
	} else {
		uniqNode.id = node.id+"/"+uniqNode.name;
	}
	
	if (!tree.getNodeByParam("id", uniqNode.id, node)) {
		return uniqNode;
	} 

	for (var i=0; i<=999999999; i++) {
		suffix = "(" + i + ")"
		uniqNode.name = name + suffix;
		if (zTreeIsRootNode(BList, node)) {
			uniqNode.id = uniqNode.name;
		} else {
			uniqNode.id = node.id+"/"+uniqNode.name;
		}
		if (!tree.getNodeByParam("id", uniqNode.id, node)) {
			return uniqNode;
		} 
	}

	console.log("zTreeUniqId: get new id failed");
}


// animate for left div
var LeftWidth;
var LeftMinWidth;
function showLeft(){
	btn = document.getElementById("toggle-tree-btn");
	btn.onclick = "";

	left = $("#left");
	console.log("showLeft");

	left.animate({width: LeftWidth}, "fast", null, function(){
		console.log("show finish, reset");
		left.css("min-width", LeftMinWidth);
		btn.onclick=hideLeft;
	});
}

function hideLeft(){
	btn = document.getElementById("toggle-tree-btn");
	btn.onclick = "";

	left = $("#left");
	console.log("hideLeft");

	LeftWidth = left.css("width");
	LeftMinWidth = left.css("min-width");

	left.css("min-width", "0em");
	left.animate({width: '0em'}, "fast", null, function(){
		console.log("bind showLeft()");
		btn.onclick=showLeft;
	});
}
//control left div functions end


//search book from current dir
function searchBook(e){
	if (e.type == "keypress") {
		if (!isKey(e, "keypress", 13)) {
			return;
		}
	}

	$("#search-list").html("");
	$("#search-list-box").show();
	$("#search-loading").show();

	tip = $("#search-tips");
	tip.html("Searching");
	tip.show();

	pattern = $("#search-input").val();

	url = "/api/books/searchBookDir";
	path = BList.getNodeByParam("id", Hist.visitedIds[Hist.curIndex]).id;
	console.log("searchBook: path is " + path);
	console.log("searchBook: pattern: " + pattern);
	$.get(url, {"path": path, "pattern": pattern}, function(data, status){
		if (status == "success") {
			console.log("searchBookDir: GET success data: " + data);
			showSearchList(data);
		} else {
			console.log("searchBookDir: GET failed status: " + status);
			tip.html("status: " + status);
		}
	});
}

function showSearchList(list){
	loading = $("#search-loading");
	tip = $("#search-tips");
	tip.hide();
	if (!list) {
		loading.hide();
		tip.show();
		tip.html("<br>Not Match");
		return;
	}
	tip.html("Generating...");
	e = $("#search-list");
	e.html("");
	for (var i=0; i<list.length; i++) {
		e.html(e.html() + genSearchList(list[i]));
	}
	e.slideDown("fast");
	tip.hide();
	loading.hide();

	$("body").bind("mousedown", onSearchListBodyMouseDown);
}
function hideSearchList(){
	$("#search-list-box").slideUp("fast");
	$("body").unbind("mousedown", onSearchListBodyMouseDown);
}
function onSearchListBodyMouseDown(event){
	if (!(event.target.id == "search-list-box" || $(event.target).parents("#search-list-box").length > 0 || $(event.target).parents("#search-group").length > 0)) {
		hideSearchList();
	}
}
function genSearchList(item){
	item = "<button type=\"button\" class=\"list-group-item search-item\" id=\"" + item + "\" onclick=\"clickSearchItem(this)\">" + item.substr(item.lastIndexOf("/")+1) + "</button>";
	return item
}
var searchRetPath;
var searchRetPathIndex = 1;
function clickSearchItem(ele){
	hideSearchList();
	openPath(ele.id);
}
function onAsyncSuccess(event, treeId, treeNode, msg){
	/*
	if (!treeNode || searchRetPath == undefined) {
		return;
	}
	var nodes = treeNode.children;
	for (i=0; i<nodes.length; i++) {
		node = nodes[i];
		if (searchRetPath[searchRetPathIndex] == node.name) {
			//BList.expandNode(node, true, false, false);
			searchRetPathIndex++;
			if (searchRetPath[searchRetPath.length-1] == node.name) {
				BList.selectNode(node);
			}
			break;
		}
	}
	*/
	//console.log("onAsyncSuccess: " + treeNode.id);
	//updateHistOverride(treeNode);
}
function clickSearchInput(){
	listBox = $("#search-list-box");
	list = $("#search-list");
	if (list.html() == "" || listBox.css("display") != "none") {
		return;
	}

	tip = $("#search-tips");
	tip.html("<br> Last Result");
	tip.show();
	listBox.slideDown("fast");

	$("body").bind("mousedown", onSearchListBodyMouseDown);
}
function clickLeft(ev){
	if (ev.target.id == "left") {
		hideSearchList();
	}
}
//functions for search book end

function refreshBookList(){
	// change index to triggle vue to refresh book-list
	console.log("refreshBookList");
	var h = Hist;
	index = h.curIndex;
	h.curIndex = -1;
	h.curIndex = index;
}

function clearBookList(){
	Hist.visitedIds = Hist.visitedIds[0];
	Hist.curIndex = -1;
}

function genBookListHTML(treeId){
	if (!treeId) {
		console.log("genBookListHTML: treeId invalid: " + treeId);
		return;
	}
	nodes = BList.getNodesByParam("id", treeId, null);
	//when refresh a node, it's children would be lost so we need to get it again.
	if (nodes.length != 1) {
		console.log("genBookListHTML: nodes.length: " + nodes.length);
		openPath(treeId);
		return;
	}

	node = nodes[0];
	booksHTML = "";
	if (!node.children) {
		console.log("genBookListHTML: node.children: " + node.children);
		openPath(treeId);
		return;
	}

	if (ViewMode == "details") {
		booksHTML += '<table class="table">'
		for (var i=0; i<node.children.length; i++) {
			/*
			if (node.children[i].bookInfo && node.children[i].bookInfo.IsBook) {
				booksHTML += genBookDetailsItem(node.children[i]);
			} else {
				booksHTML += genDirDetailsItem(node.children[i]);
			}
			*/
			booksHTML += genBookListDetailsItem(node.children[i]);
		}
		booksHTML += "</table>"
	} else if (ViewMode == "icons") {
		for (var i=0; i<node.children.length; i++) {
			if (node.children[i].bookInfo && node.children[i].bookInfo.IsBook) {
				booksHTML += genBookHTML(node.children[i]);
			} else {
				booksHTML += genDirHTML(node.children[i]);
			}
		}
	} else {
		console.log("genBookListHTML: unknow ViewMode: " + ViewMode);
	}
	return booksHTML;
}

function genBookListDetailsItem(treeNode){
	//console.log("genBookListDetailsItem");
	var modTime = new Date();
	if (treeNode.bookInfo) {
		modTime.setTime(Date.parse(treeNode.bookInfo.BModTime))
	}
	
	var item = "";
	
	if (treeNode.bookInfo && treeNode.bookInfo.IsBook) {
		item += '<tr class="book isBook" id="book-' + treeNode.id + '" onclick="clickBook(this)" ondblclick="dblclickBook(this)">';
		item += '<td style="width: 20px; padding-right: 0">' + genBookIconStr(treeNode, "details") + '</td>'
		item += '<td style="width: 45%"><textarea class="file-name-details common-word-break-all" readonly="true" rows="1" style="vertical-align: bottom">' + treeNode.name + "</textarea></td>";
		item += '<td style="width: 100px">' + getFileSizeStr(treeNode.bookInfo.BSize) + "</td>";
		item += '<td style="width: 100px">' + treeNode.bookInfo.BType.slice(1) + "</td>";
	} else {
		item += '<tr class=\"book isDir\" id="dir-' + treeNode.id + '" onclick="clickDir(this)" ondblclick="dblclickDir(this)">';
		item += '<td style="width: 20px; padding-right: 0"><img src="/static/img/books/folder.png" class="book-list-details-icon"></img></td>'
		item += '<td style="width: 45%">' + '<textarea class="file-name-details common-word-break-all" readonly="true" rows="1" style="vertical-align: bottom">' + treeNode.name + "</textarea></td>";
		item += '<td style="width: 100px">' + "" + "</td>";
		item += '<td style="width: 100px">' + "文件夹" + "</td>";
	}
	item += '<td class="hidden-xs" style="width: 200px">' + modTime.toLocaleDateString() + " " + modTime.toLocaleTimeString() + "</td>";
	item += '<td></td>'
	item += "</tr>";
	//console.log("genBookDetailsHead: item: " + item);
	return item;
}

function genBookHTML(treeNode){
	//console.log("genBookHTML: " + treeNode.id);
	var bookTips = genFileInfoStr(treeNode);
	var bookHTML = "";
	//bookHTML = '<div class="book isBook" title="' + bookTips + '">';

	bookHTML += '<div id="book-' + treeNode.id + '" class="book isBook BLInnerBox BLInnerBoxBook" onclick="clickBook(this)" ondblclick="dblclickBook(this)" title="' + bookTips + '">'

	bookHTML += "<div class=\"book-list-icon center-block\">"
	bookHTML += genBookIconStr(treeNode, "icons");
	bookHTML += "</div>"

//	bookHTML += "<div class=\"book-title\">"
//	bookHTML += "<p class=\"text-center center-block\">" + treeNode.name + "</p>"
//	bookHTML += "</div>"
	bookHTML += '<textarea class="file-name text-center common-word-break-all" readonly="true" rows="2">' + treeNode.name + "</textarea>"

	bookHTML += "</div>"
	//bookHTML += "</div>"

	return bookHTML
}
function genDirHTML(treeNode){
	var bookHTML = "";
	bookHTML += "<div id=\"dir-" + treeNode.id + "\" class=\"book isDir BLInnerBox BLInnerBoxDir center-block\" onclick=\"clickDir(this)\" ondblclick=\"dblclickDir(this)\">"

	bookHTML += "<div class=\"book-list-icon center-block\">";
	//bookHTML += "<span class=\"icon-folder icon-size\"><span class=\"path1\"></span><span class=\"path2\"></span></span>";
	bookHTML += '<img src="/static/img/books/folder.png" class="book-list-icon"></img>'
	bookHTML += "</div>"
/*
	bookHTML += "<div class=\"book-title\">"
	bookHTML += "<p class=\"text-center center-block\">" + treeNode.name + "</p>"
	bookHTML += "</div>"
*/
	bookHTML += '<textarea class="file-name text-center common-word-break-all" readonly="true" rows="2">' + treeNode.name + "</textarea>"

	bookHTML += "</div>"
	//bookHTML += "</div>"

	return bookHTML
}
/*
function genBookImgSrc(treeNode) {
	var src;
	switch (treeNode.bookInfo.BType.toLowerCase()) {
		case ".txt":
			src = "/static/img/books/txt.png";
			break;
		case ".pdf":
			src = "/static/img/books/pdf.png";
			break;
		case ".webbook":
			src = "/static/img/books/web.png";
			break;
		default:
			src = "/static/img/books/unknow.png";
			break;
	}
	return src;
}
*/
function genBookIconStr(treeNode, viewMode){
	var str;
	if (ViewMode == "icons") {
		cls = "book-list-icon";
	} else if (ViewMode == "details") {
		cls = "book-list-details-icon"
	} else {
		console.log("genBookIconStr: unknow view mode: " + viewMode);
		return;
	}
	imgPath = "/static/img/books/"
	switch (treeNode.bookInfo.BType.toLowerCase()) {
		case ".txt":
			//str = '<span class="icon-txt icon-size"><span class="path1"></span><span class="path2"></span><span class="path3"></span><span class="path4"></span></span>';
			str = '<img src=' + imgPath + 'txt.png class="' + cls + '"></img>'
			break;
		case ".pdf":
			//str = '<span class="icon-pdf icon-size"><span class="path1"></span><span class="path2"></span><span class="path3"></span><span class="path4"></span></span>';
			str = '<img src=' + imgPath + 'pdf.png class="' + cls + '"></img>'
			break;
		case ".epub":
			//str = '<span class="icon-epub icon-size"><span class="path1"></span><span class="path2"></span><span class="path3"></span><span class="path4"></span></span>';
			str = '<img src=' + imgPath + 'epub.png class="' + cls + '"></img>'
			break;
		case ".webbook":
			//str = '<span class="icon-book2 icon-size"></span>';
			str = '<img src=' + imgPath + 'web.png class="' + cls + '"></img>'
			break;
		case ".linkbook":
			str = '<img src=' + imgPath + 'link.png class="' + cls + '"></img>'
			break;
		case ".md":
			str = '<img src=' + imgPath + 'md.png class="' + cls + '"></img>'
			break;
		// html/htm/xhtml 都使用 html.png 图标
		case ".html":
			str = '<img src=' + imgPath + 'html.png class="' + cls + '"></img>'
			break;
		case ".htm":
			str = '<img src=' + imgPath + 'html.png class="' + cls + '"></img>'
			break;
		case ".xhtml":
			str = '<img src=' + imgPath + 'html.png class="' + cls + '"></img>'
			break;
		default:
			//str = '<span class="icon-libreoffice icon-size"></span>';
			str = '<img src=' + imgPath + 'unknow.png class="' + cls + '"></img>'
			//break;
	}
	return str;
}
//functions for show book list end


// book event in book-list

//selected book list item
var seBLItem;
var seBLItemCSS = {"background-color": "#cce8ff", "border-color": "#99d1ff", "border-style": "solid", "border-width": "1px"}
var BLItemCSS = {"background-color": "", "border-color": "transparent", "border-style": "solid", "border-width": "1px"}
function clickBook(ele) {
	console.log("clickBook");
	clearSelectedBookListItem()
/*
	id = ele.id.replace("book-", "")
	var node = BList.getNodeByParam("id", id, null);
	BList.selectNode(node);
	showBookInfo(node);
*/
	selectBookListItem(ele);
}

function dblclickBook(ele) {
	id = ele.id.replace("book-", "")
	var node = BList.getNodeByParam("id", id, null);
	BList.selectNode(node);
	openBook(node);
}

function clickDir(ele) {
	clearSelectedBookListItem();
	id = ele.id.replace("dir-", "")
	var node = BList.getNodeByParam("id", id, null);

	//hideBookInfo(node);
	BList.selectNode(node);
	selectBookListItem(ele);
}
function dblclickDir(ele) {
	id = ele.id.replace("dir-", "")
	var node = BList.getNodeByParam("id", id, null);

	//updatePathNav(node);
	openDir(node);
	//updateVisistHist(node);
}

function selectBookListItem(ele){
	//console.log("selectBookListItem: ele.id: " + ele.id);
	clearSelectedBookListItem();
	seBLItem = $(ele);
	$(ele).css(seBLItemCSS);
}

function clearSelectedBookListItem(){
	if (seBLItem) {
		$(seBLItem).css(BLItemCSS);
		seBLItem = null;
	}
}

function showBookInfo(treeNode) {
	bookDescription = $("#book-description");
	bookDescriptionAlert = $("#book-description-alert")
	$("#book-details").css("display", "flex");

	//get book's description from server and show it.
	$("#file-info").html(genFileInfo(treeNode));

	//show book download link
	showDownloadLink(treeNode);
	showOpenLink(treeNode);

	//get book's description from server and show it.
	/*
	descriptionUrl = "/fmtBooks/" + treeNode.id + "/description.txt"
	$.ajax({url: descriptionUrl, success: function(data, status){
		bookDescription.html(data);
		bookDescriptionAlert.css("display", "none");
	}, error: function(xhr, status, err){
		bookDescription.html("");
		bookDescriptionAlert.css("display", "flex");
		bookDescriptionAlert.html("Get Description: " + status + ": " + xhr.status + " " + xhr.statusText);
	}});
	*/

	var t = "属性";
	var na = treeNode.name;
	if (na.lastIndexOf(".") != null) {
		t = na.substr(0, na.lastIndexOf("."));
	}
	layer.open({
		type: 1,
		title: t,
		anim: 2,
		area: ['300px', '500px'],
		shade: 0,
		zIndex: 45, // bootstrap modal z-index is 1050, right menu's z-index is 75
		content: $("#book-details-layer"),
	});
}

function showDirInfo(node) {
	console.log("showDirInfo");
	var info = $("#dir-info");
	info.empty();
	
	var sizeInfo = $("<p></p>");
	sizeInfo.append('<span>大小: </span>');
	var size = $('<span></span>').append(loadingIconText);
	sizeInfo.append(size);
	info.append(sizeInfo);

	var spaceUrl = "/api/books/booksSpace?path=" + node.id;
	$.get(spaceUrl, function(data, status){
		if (status != "success") {
			console.log("genUserInfo: get space failed: " + data);
			if (data == "err: exit status 1") {
				data = "路径出错"
			}
		}
		size.html(data);
	});


	var numInfo = $("<p></p>");
	numInfo.append('<span>数量: </span>');
	var num = $('<span></span>').append(loadingIconText);
	numInfo.append(num);
	info.append(numInfo);
	var numUrl = "/api/books/booksNum?path=" + node.id;
	$.get(numUrl, function(data, status){
		num.empty();
		if (status == "success") {
			num.html(data);
		} else {
			num.html("连接错误: " + status);
		}
	});

	var pathInfo = $("<p></p>").html("路径: " + zTreeGetRootNode(BList).name + "/" + node.id);
	info.append(pathInfo);

	layer.open({
		type: 1,
		title: node.name,
		anim: 2,
		area: ['300px', '500px'],
		shade: 0,
		zIndex: 45, // bootstrap modal z-index is 1050, right menu's z-index is 75
		content: $("#dir-details-layer"),
	});
	$("#dir-details-layer").css("height", "458px");
}

function clickBookList(e) {
	console.log("clickBookList");
	if (!($(e.target).parents(".book").length > 0 || $(e.target).hasClass(".book"))){
		clearSelectedBookListItem();

		//select current dir in book-tree
		var nodes = BList.getSelectedNodes();
		if (nodes.length == 1) {
			p = nodes[0].getParentNode();
			BList.selectNode(p);
		}
	}
}

function genFileInfo(treeNode) {
	var modTime = new Date()
	modTime.setTime(Date.parse(treeNode.bookInfo.BModTime))
	fileInfo = "<p>格式: " + treeNode.bookInfo.BType.slice(1) + "</p>"
	fileInfo += "<p>文件大小: " + getFileSizeStr(treeNode.bookInfo.BSize);
	fileInfo += "<p>修改时间: " + modTime.toLocaleDateString() + " " + modTime.toLocaleTimeString() + "</p>"

	return fileInfo
}

function genFileInfoStr(treeNode) {
	var modTime = new Date()
	modTime.setTime(Date.parse(treeNode.bookInfo.BModTime))
	fileInfo = "格式: " + treeNode.bookInfo.BType.slice(1);
	fileInfo += "\n文件大小: " + getFileSizeStr(treeNode.bookInfo.BSize);
	fileInfo += "\n修改时间: " + modTime.toLocaleDateString() + " " + modTime.toLocaleTimeString()
	return fileInfo
}

function showDownloadLink(node) {
	console.log("showDownloadLinkByNode");
	if (node.bookInfo.BType.toLowerCase() == ".webbook") {
		$("#book-download").hide();
		return;
	} else {
		$("#book-download").show();
	}

	var rootNode = BList.getNodes()[0];

	path = rootNode.name + "/" + node.id;
	url = location.protocol + "//" + location.hostname + ":" + location.port + "/" + path;

	showDownloadQrcode(url);
	showDownloadBookUrl(url, node.name);
}

function genDownloadUrl(node){
	if (node.isParent) {
		console.log("could not download dir");
		return null;
	}

	if (!node.bookInfo.IsBook) {
		console.log("not a book, could not download");
		return null;
	}

	if (node.bookInfo.BType.toLowerCase() == ".webbook") {
		console.log("could not download web book now");
		return null;
	}

	rNode = zTreeGetRootNode(BList);
	path = rNode.name  + "/" + node.id;
	url = location.protocol + "//" + location.hostname + ":" + location.port + "/" + path;
	return url;
}

var bigQrcodeSize = 210;
var qrcodeSize = 100;
var qrcodeBigLen = 150;
function showDownloadQrcode(url){
	//reference http://www.jq22.com/jquery-info294
	bqrc = $("#book-download-qrcode")
	bqrc.html("");

	eUrl = encodeURI(url);

	var size;
	if (eUrl.length > qrcodeBigLen){
		size = bigQrcodeSize;
	} else {
		size = qrcodeSize;
	}

    bqrc.qrcode({
		width: size,
		height: size,
	    text: eUrl
	});
}

function showDownloadBookUrl(url, name){
	link = $("#book-download-link");
	link.attr("href", url);
	link.attr("download", name);
	link.html(name);
}

function showOpenLink(node){
	console.log("showOpenLinkByNode");
	url = genOpenBookUrl(node);

	showOpenBookQrcode(url);
	showOpenBookUrl(url, node.name);
}

function showOpenBookQrcode(url){
	bqrc = $("#book-open-qrcode")

	bqrc.html("");

	eUrl = encodeURI(url);

	var size;
	if (eUrl.length > qrcodeBigLen){
		size = bigQrcodeSize;
	} else {
		size = qrcodeSize;
	}

    bqrc.qrcode({
		width: size,
		height: size,
	    text: eUrl
	});
}

function showOpenBookUrl(url, name){
	link = $("#book-open-link");
	link.attr("href", url);
	link.html(name);
}

function genOpenBookUrl(treeNode){
	var path;
	var filePath = encodeURIComponent(treeNode.id);
	rNode = zTreeGetRootNode(BList);
	switch (treeNode.bookInfo.BType.toLowerCase()) {
		case ".txt":
			//path = "/api/reader/open?file=" + filePath;
			path = "/static/reader/txt/#/read/" + filePath + "/1.txt";
			break;
		case ".pdf":
			path = "/static/reader/pdf/web/viewer.html?file=/" + rNode.name + "/" + filePath;
			break;
		case ".webbook":
			path = treeNode.bookInfo.BEntry;
			break;
		case ".epub":
			path = "/api/reader/epub?file=/" + rNode.name + "/" + filePath;
			break;
		case ".md":
			path = "/static/reader/md/?file=/" + rNode.name + "/" + filePath;
			break;
		default:
			path = treeNode.bookInfo.BEntry;
	}

	var url = location.protocol + "//" + location.hostname + ":" + location.port + "/" + path;
	return url;
}
// book event in book-list end


// nav bar
function updatePathNav(treeNode) {
	console.log("updatePathNav");
	var workNode = treeNode;
	e = $("#path-nav");

	e.html("");
	newLi = "<li id=\"path-nav-" + workNode.id +"\" class=\"btn btn-link active nav-item\" onclick=\"clickNav(this)\">" + workNode.name + "</li>";
	e.prepend(newLi);
	workNode = workNode.getParentNode()
	while (workNode != null) {
		newLi = "<li id=\"path-nav-" + workNode.id +"\" class=\"btn btn-link nav-item\" onclick=\"clickNav(this)\">" + workNode.name + "</li>";
		e.prepend(newLi);
		workNode = workNode.getParentNode()
	}

	//newLi = "<li id=\"go-pre\" class=\"btn btn-link active nav-item\">"
	newLi = "<span id=\"go-hist\" class=\"go-hist-class\">"
	newLi += "<span id=go-hist-pre class=\"glyphicon glyphicon-arrow-left go-hist-item go-hist-item-inactive\" aria-hidden=\"true\" onclick=\"clickGoPre(this)\"></span>"
	newLi += "<span id=go-hist-up class=\"glyphicon glyphicon-arrow-up go-hist-item go-hist-item-inactive\" aria-hidden=\"true\" onclick=\"clickGoUp(this)\"></span>"
	newLi += "<span id=go-hist-next class=\"glyphicon glyphicon-arrow-right go-hist-item go-hist-item-inactive\" aria-hidden=\"true\" onclick=\"clickGoNext(this)\"></span>"
	newLi += "<span id=go-hist-refresh class=\"glyphicon glyphicon-refresh go-hist-item go-hist-item-active\" aria-hidden=\"true\" onclick=\"clickGoRefresh(this)\"></span>"
	newLi += "</span>"
	//newLi += "</li>";

	e.prepend(newLi);

	var vm = genViewModeDOM();
	e.prepend(vm);

	updateHistIcon();
}

function genViewModeDOM(){
	var viewMode = '<span style="border-right: inset 1px gray;">';

	if (ViewMode == "icons") {
		//console.log("genViewModeDOM: icons");
		viewMode += '<span id="view-mode-toggle" title="切换显示方式" class="glyphicon glyphicon-th-list go-hist-item" aria-hidden="true" onclick="clickSetViewMode(this)"></span>';
	} else if (ViewMode == "details"){
		//console.log("genViewModeDOM: details");
		viewMode += '<span id="view-mode-toggle" title="切换显示方式" class="glyphicon glyphicon-th go-hist-item" aria-hidden="true" onclick="clickSetViewMode(this)"></span>';
	} else {
		console.log("genViewModeDOM: unknow view mode: " + ViewMode);
	}
	viewMode += '</span>';
	return viewMode;
}

function clickSetViewMode(el){
	console.log("clickSetViewMode");
	toggle = $("#view-mode-toggle");

	if (ViewMode == "icons") {
		ViewMode = "details";
		toggle.removeClass("glyphicon-th-list").addClass("glyphicon-th");
		$("#book-list").css("padding", "0em 0em 0em 0em");
		$("#book-list-details-mode-head").show();
		localStorage.setItem("ViewMode", "details");
	} else if (ViewMode == "details") {
		ViewMode = "icons";
		toggle.removeClass("glyphicon-th").addClass("glyphicon-th-lis");
		$("#book-list").css("padding", "1em 0em 1em 1em");
		$("#book-list-details-mode-head").hide();
		localStorage.setItem("ViewMode", "icons");
	} else {
		console.log("clickSetViewMode: unknow ViewMode: " + ViewMode);
		return;
	}
	refreshBookList();
}

function updatePathNavById(treeId){
	if (!treeId) {
		console.log("updatePathNavById: treeId invalid: " + treeId);
		return;
	}
	nodes = BList.getNodesByParam("id", treeId, null);
	if (nodes.length != 1) {
		console.log("Error: updatePathNavById: nodes.length: " + nodes.length);
		return;
	}

	node = nodes[0];
	updatePathNav(node);
}

function clickNav(ele){
	id = ele.id.replace("path-nav-", "")
	nodes = BList.getNodesByParam("id", id, null);
	node = nodes[0];
	BList.selectNode(node);
	openDir(node);
}

//current visitHist is a list of visited nodes' id
function clickGoPre(){
	updateHistMovePre();
	zTreeSelectNodeById(BList, Hist.visitedIds[Hist.curIndex]);
}

function clickGoNext(){
	updateHistMoveNext();
	zTreeSelectNodeById(BList, Hist.visitedIds[Hist.curIndex]);
}

function clickGoUp(){
	console.log("clickGoUp");

	h = Hist;
	node = BList.getNodeByParam("id", h.visitedIds[h.curIndex], null);
	updateHistOverride(node.getParentNode());
	zTreeSelectNodeById(BList, Hist.visitedIds[Hist.curIndex]);
}

function clickGoRefresh(){
	//console.log("clickGoRfresh");

	h = Hist;
	curId = h.visitedIds[h.curIndex]
	rNode = zTreeGetRootNode(BList);

	var loadIndex = showGlobalLoading()
	if (curId == rNode.id) {
		//refresh root node
		console.log("refresh root node");
		BList.reAsyncChildNodes(null, "refresh", false, function(){
			refreshBookList();
			expandRoot();
			closeGlobalLoading(loadIndex);
		});
	} else {
		console.log("refresh: " + curId);
		node = BList.getNodeByParam("id", curId, null);
		BList.reAsyncChildNodes(node, "refresh", null, function(){
			refreshBookList();
			closeGlobalLoading(loadIndex);
		});
	}
}

function zTreeGetRootNode(tree){
	nodes = tree.getNodes();
	if (nodes.length > 0) {
		return nodes[0];
	}
}

function zTreeIsRootNode(tree, node){
	rNode = zTreeGetRootNode(tree);
	if (rNode === node) {
		return true;
	} else {
		return false;
	}
}

function zTreeSelectNodeById(tree, treeId) {
	node = tree.getNodeByParam("id", treeId);
	if (!node) {
		console.log("zTreeSelectNodeById: node: " + node);
		return;
	}

	tree.selectNode(node);
}

function updateBookListSelectedItemByTree(){
	nodes = BList.getSelectedNodes();
	if (nodes.length == 1) {
		node = nodes[0];
		if (node.isParent) {
			//hideBookInfo();
			id = "dir-" + node.id;
		} else {
			id = "book-" + node.id;
		}
		ele = document.getElementById(id)
		selectBookListItem(ele);
	} else {
		console.log("updateBookListSelectedItemByTree: invalid nodes.length: " + nodes.length);
	}
}

function updateHistOverride(treeNode){
	if (!treeNode) {
		console.log("updateHistOverride: treeNode: " + treeNode);
		return;
	}

	h = Hist;
	curId = h.visitedIds[h.curIndex];
	console.log("updateHistOverride: Before: h.visitedIds.length: " + h.visitedIds.length + " h.curIndex: " + h.curIndex + " curId: " + curId);
	if (treeNode.id == curId) {
		console.log("updateHistOverride: curId == treeNode.id, override current index to emit Here");
		index = h.curIndex
		h.curIndex = -1;
		h.curIndex = index;
		return;
	}

	//clear items after visitCurIndex
	while (h.curIndex >= 0 && h.curIndex != (h.visitedIds.length - 1)) {
		h.visitedIds.pop();
	}

	h.curIndex = h.visitedIds.push(treeNode.id) - 1;
	console.log("updateHistOverride: After: h.visitedIds.length: " + h.visitedIds.length + " h.curIndex: " + h.curIndex + " curId: " + curId);
}

function updateHistMoveNext(){
	h = Hist;
	console.log("updateHistMoveNext: from " + h.curIndex);
	len = h.visitedIds.length;
	if (h.curIndex < len-1) {
		h.curIndex += 1;
		console.log("updateHistMoveNext: to " + h.curIndex);
	} else {
		console.log("Error: updateHistMoveNext: h.curIndex is the last one");
	}
}

function updateHistMovePre(){
	h = Hist;
	console.log("updateHistMovePre: from " + h.curIndex);
	if (h.curIndex > 0) {
		h.curIndex -= 1;
		console.log("updateHistMovePre: to " + h.curIndex);
	} else {
		console.log("Error: updateHistMovePre: no more pre hist item to move");
	}
}

function updateHistIcon(){
	console.log("updateHistIcon");

	h = Hist;
	curId = h.visitedIds[h.curIndex];
	//set go-hist-pre icon
	if (h.curIndex > 0){
		setHistActive($("#go-hist-pre"));
	} else {
		setHistInactive($("#go-hist-pre"));;
	}

	//set go-hist-up icon
	nodes = BList.getNodesByParam("id", curId, null);
	node = nodes[0];
	//showAlert("node.id: " + node.id);
	var pNode = node.getParentNode();
	if (pNode == null) {
		setHistInactive($("#go-hist-up"));
	} else {
		setHistActive($("#go-hist-up"));
	}

	//set go-hist-next icon
	if (h.curIndex < (h.visitedIds.length-1)) {
		setHistActive($("#go-hist-next"));
	} else {
		setHistInactive($("#go-hist-next"));
	}
}

function setHistActive(ele){
	//showAlert("set it active color: " + ele.css("width"));
	//ele.css("color", black);
	ele.removeClass("go-hist-item-inactive");
	ele.addClass("go-hist-item-active");
}

function setHistInactive(ele){
	//showAlert("color: " + $("#ele.id").css("color"));
	//ele.css("color", "#ababab");
	ele.removeClass("go-hist-item-active");
	ele.addClass("go-hist-item-inactive");
}
//path nav end


//center event
function centerRMenuInit(){
	$("#center").bind("contextmenu", function(e){
		showCenterRMenu(e)
		return false;
	})
}

function showCenterRMenu(ev){
	console.log("showCenterRMenu");
	//console.log("showCenterRMenu: seBLItem id: " + seBLItem.attr("id"));
	showRMenuBy = "center";
	showCenterRMenuSelect(ev);
	centerFiltRMenuItem(ev);
	menu = $("#BTreeRMenu");

	// x 或 y 不能是原值，如果是原值的话会显示浏览器默认菜单
	x = ev.pageX + 1;
    y = ev.pageY + 1;

	//adjust y
	center = $("#center")
	menuBottom = y + menu.height();
	centerBottom = center.offset().top + center.height();
	if (menuBottom > centerBottom) {
		y -= menu.height();
	}

	//adjust x
	menuRight = x + menu.width();
	centerRight = center.offset().left + center.width();
	if (menuRight > centerRight) {
		x -= menu.width() + 1;
	}

    menu.css({"top":y+"px", "left":x+"px"});
    menu.show();

	$("body").bind("mousedown", onRMenuBodyMouseDown);
}

// 选定 center 中触发右键菜单的项
function showCenterRMenuSelect(ev){
	console.log("showCenterRMenuSelect");
	var elem = $(ev.target).parents(".book")[0];
	//clearSelectedBookListItem()
	//console.log("showCenterRMenuSelect: elem.id: " + elem.id);
	selectBookListItem(elem);
}

function centerFiltRMenuItem(ev){
	var elem = $(ev.target);
	var type;
	if (elem.parents(".isBook").length > 0) {
		type = "book";
	} else if (elem.parents(".isDir").length > 0) {
		type = "dir";
	} else {
		type = "bg";
	}

	var add = $("#book-tree-rmenu-add");
	var upload = $("#book-tree-rmenu-upload");
	var download = $("#book-tree-rmenu-download");
	var refresh = $("#book-tree-rmenu-refresh");
	var copy = $("#book-tree-rmenu-copy");
	var cut = $("#book-tree-rmenu-move");
	var paste = $("#book-tree-rmenu-paste");
	var remove = $("#book-tree-rmenu-remove");
	var rename = $("#book-tree-rmenu-rename");
	var newDir = $("#book-tree-rmenu-newdir");
	//var details = $("#book-tree-rmenu-details"); //always show

	if (type == "book") {
		add.hide();
		upload.hide();

		if (supportDownloadBook(centerRMenuGetTargetNode())) {
			download.show();
		} else {
			download.hide();
		}

		refresh.hide();
		copy.show();
		cut.show();
		paste.hide();
		remove.show();
		rename.show();
		newDir.hide();
		return;
	}

	if (FileCache.type) {
		paste.show();
	} else {
		paste.hide();
	}
	add.show();

	if (type == "dir") {
		upload.show();
		download.hide();
		refresh.hide();
		copy.show();
		cut.show();
		remove.show();
		rename.show();
		newDir.hide();
		return;
	}

	upload.show();
	download.hide();
	refresh.show();
	copy.hide();
	cut.hide();
	remove.hide();
	rename.hide();
	newDir.show();
	return;
}

function getBookTypeStr(node){
	return node.bookInfo.BType.toLowerCase();
}

function supportDownloadBook(node){
	var type = getBookTypeStr(node);
	switch(type) {
		case ".epub":
			return true;
			break;
		case ".txt":
			return true;
			break;
		case ".pdf":
			return true;
			break;
		default:
			return false;
	}
}

// 返回触发右键菜单的 book 或 dir 的类型，可能的类型为： book/dir/bg; (bg 表示在空白处点击)
function centerRMenuGetTargetType(){
	//console.log("centerRMenuGetTargetType: seBLItem html: " +  seBLItem.html());
	//console.log("centerRMenuGetTargetType: seBLItem has isBook: " +  seBLItem.hasClass("isBook"));
	//console.log("centerRMenuGetTargetType: seBLItem has isDir: " +  seBLItem.hasClass("isDir"));
	if (seBLItem.hasClass("isBook")) {
		//console.log("centerRMenuGetTargetType: book");
		return "book";
	} else if (seBLItem.hasClass("isDir")) {
		//console.log("centerRMenuGetTargetType: dir");
		return "dir";
	} else {
		//console.log("centerRMenuGetTargetType: bg");
		return "bg";
	}
}

function centerRMenuGetTargetElemId(){
	console.log("centerRMenuGetTargetElemId: seBLItem id: " + seBLItem.attr("id"));
	return seBLItem.attr("id");
}

// 返回出发右键菜单的 book 或 dir 对应的 book-tree 上的 node id
function centerRMenuGetTargetId(){
	var itemId = centerRMenuGetTargetElemId();
	//console.log("centerRMenuGetTargetId: itemId: " + itemId);
	var type = centerRMenuGetTargetType();
	//console.log("centerRMenuGetTargetId: type: " + type);
	var id;
	if (type == "book") {
		id = itemId.replace("book-", "");
	} else if (type == "dir") {
		id = itemId.replace("dir-", "");
	} else {
		id =  Hist.visitedIds[Hist.curIndex];
	}
	//console.log("centerRMenuGetTargetId: return id: " + id);
	return id;
}

// 返回触发右键菜单的 book 或 dir 对应的 zTree 节点
function centerRMenuGetTargetNode(){
	var node = BList.getNodeByParam("id", centerRMenuGetTargetId());
	console.log("centerRMenuGetTargetNode: node.id: " + node.id);
	return node;
}

var RenamingElem;			//renaming book/dir elem
var RenamingElemType;		//renaming book/dir type
var RenamingFileElem;		//renaming textarea
var RenamingFileElemHTML;	//renaming textarea text
var RenamingNode;			//tree node
var RenamingOldPath;
function centerRMenuRename(){
	console.log("centerRMenuRename");
	var name;
	if (ViewMode == "icons") {
		console.log("centerRMenuRename");
		name = seBLItem.find(".file-name");
	} else if (ViewMode == "details") {
		console.log("centerRMenuRename");
		name = seBLItem.find(".file-name-details");
	} else {
		console.log("centerRMenuRename: unknow ViewMode: " + ViewMode);
		return;
	}
	
	RenamingElem = seBLItem
	//console.log("centerRMenuRename: id: " + $(RenamingElem).attr("id"));
	RenamingElemType = centerRMenuGetTargetType();
	RenamingFileElem = name;
	RenamingFileElemHTML = name.html();
	RenamingNode = centerRMenuGetTargetNode();
	RenamingOldPath = centerRMenuGetTargetId();
	//console.log("centerRMenuRename: RenamingOldPath: " + RenamingOldPath);

	clearSelectedBookListItem();
	centerRMenuRenameSetMode(name);

	clearSelectedBookListItem();
}
function centerRMenuRenamekKeypressCB(ev){
	//console.log("centerRMenuRenamekKeypressCB: ev.which： " + ev.which);
	if (isKey(ev, "keydown", 13)) {
		console.log("centerRMenuRenamekKeypressCB: go to rename");
		centerRMenuRenameCB(ev);
		return;
	} else if (isKey(ev, "keydown", 27)) {
		console.log("centerRMenuRenamekKeypressCB: cancel rename");
		centerRMenuRenameCancel();
		return;
	}
}
function centerRMenuRenameCB(ev){
	console.log("centerRMenuRenameCB: ev.type: " + ev.type);
	var el = $(ev.target);
	if (ev.type == "mousedown" && el.html() == RenamingFileElemHTML) {
		console.log("centerRMenuRenameCB: click renaming area, ignore");
		return;
	}
	var name = $(RenamingFileElem);
	centerRMenuRenameExitMode(name);
	
	newPath = Hist.visitedIds[Hist.curIndex] + "/" + name.val();
	//console.log("centerRMenuRenameCB: newPath: " + newPath);
	rename(RenamingOldPath, newPath);
}
function rename(oldPath, newPath){
	if (newPath.substr(0, 2) == "./") {
		newPath = newPath.substr(2);
	}
	if (oldPath == newPath) {
		console.log("rename: oldPath == newPath");
		return;
	}
	url = "/api/booksMgmt/rename";
	var node = BList.getNodeByParam("id", oldPath);
	var loadIndex = showGlobalLoading();
	pNode = node.getParentNode();
	$.get(url, {"oldPath": oldPath, "newPath": newPath}, function(data, status){
		closeGlobalLoading(loadIndex);
		BList.setting.callback.onRename = null;
		if (status == "success") {
			console.log("rename: GET success data: " + data);
			if (data == null) {
				console.log("rename: rename success");
			} else {
				console.log("rename: rename failed");
				centerRMenuRenameCancel();
				showAlert("rename failed: " + data);
			}
		} else {
			console.log("rename: GET failed status: " + status);
			showAlert("rename failed: " + status);
		}

		
		refreshNode(BList, pNode, function(){selectCenterElemById(newPath);});
	});
}

//cancel rename mode by press esc
function centerRMenuRenameCancel(){
	RenamingFileElem.html(RenamingFileElemHTML);
	RenamingFileElem.val(RenamingFileElemHTML);
	var name = $(RenamingFileElem);
	centerRMenuRenameExitMode(name);
	
}
function centerRMenuRenameSetCB(){
	$("body").bind("mousedown",centerRMenuRenameCB);
	$("body").bind("keydown", centerRMenuRenamekKeypressCB);
	$("#center").unbind("keydown", centerShortCutKey);
}
function centerRMenuRenameUnsetCB(){
	$("body").unbind("mousedown", centerRMenuRenameCB);
	$("body").unbind("keydown", centerRMenuRenamekKeypressCB);
	console.log("centerRMenuRenameUnsetCB: bind centerShortCutKey");
	$("#center").bind("keydown", centerShortCutKey);
}
function centerRMenuRenameSetMode(elem){
	var name = $(elem);
	name.attr("readonly", false);
	name.css("border", "solid 1px #d0d0d0");
	name.focus();
	name.select();

	$(RenamingFileElem).css("background-color", "white");

	centerRMenuRenameSetCB();
}
function centerRMenuRenameExitMode(elem){
	var name = $(elem);
	name.attr("readonly", true);
	name.css("border", "none 0px");
	$(RenamingFileElem).css("background-color", "transparent");

	centerRMenuRenameUnsetCB();
}
//center event end

function openBook(treeNode){
	switch (treeNode.bookInfo.BType.toLowerCase()) {
		case ".txt":
			openTxt(treeNode);
			return;
			break;
	}

	url = genOpenBookUrl(treeNode);
	window.open(url);
}

function openTxt(treeNode){
	var filePath = encodeURIComponent(treeNode.id);
	var rNode = zTreeGetRootNode(BList);
	var openUrl = genOpenBookUrl(treeNode);
	var checkUrl = "/cache/" + rNode.name + "/" + filePath + "/info.txt";
	console.log("openUrl: " + openUrl);
	console.log("openTxt: checkUrl: " + checkUrl);

	var ladingPage = location.protocol + "//" + location.hostname + ":" + location.port + "/" + 'static/reader/txt/#/loading';
	var readerPage = window.open(ladingPage);
	window.open(openUrl);

	axios.get(checkUrl).then(function(res){
		console.log("check return success");
		readerPage.location.href = openUrl;
	}).catch(function(err){
		console.log("check return failed: err: " + err);
		var formatUrl = "/api/reader/format?path=" + filePath;
		axios.get(formatUrl).then(function(res){
			console.log("format success");
			readerPage.location.href = openUrl;
		}).catch(function(err){
			console.log("format err: " + err);
		});
	});
}

function openWindowForAxios(url) {
	var a = document.createElement('a');
	a.href = url;
	a.target = "_blank";

	//append to body to trigger download in firefox
	document.body.appendChild(a);
	
	a.click();
	document.body.removeChild(a);
}

//openDir would DO override Hist
function openDir(treeNode) {
	console.log("openDir");
	var event;
	//BList.selectNode(treeNode);
	if (treeNode.children == undefined) {
		BList.expandNode(treeNode, true, false, true, true);
		return;
	}
	updateHistOverride(treeNode);
}

var OpenPathCtr = {
	dirs: "",
};
//openPath would NOT override Hist
function openPath(path){
	console.log("openPath: path: " + path);
	if (!path) {
		console.log("openPath: path: " + path);
		return;
	}

	OpenPathCtr.dirs = path.split("/");
	OpenPathCtr.dirs.reverse();

	var nextNode = zTreeGetRootNode(BList);
	for(;OpenPathCtr.dirs.length > 0; OpenPathCtr.dirs.pop()) {
		//console.log("OpenPathCtr.dirs: " + OpenPathCtr.dirs);
		nextName = OpenPathCtr.dirs[OpenPathCtr.dirs.length-1];
		//console.log("nextName: " + nextName);
		nextNode = BList.getNodeByParam("name", nextName, nextNode);
		if (!nextNode) {
			console.log("openPath: could NOT get nextNode by " + nextName);
			return;
		}
		if (nextNode.isParent) {
			//console.log("nextNode.children: " + nextNode.children + " nextNode.children.length: " + nextNode.children.length);
			if (!nextNode.children) {
				BList.setting.callback.onAsyncSuccess = openPathAsyncSuccess;
				BList.expandNode(nextNode, true, false, true, false);
				break;
			} else {
				console.log("openPath: expanding: " + nextNode.id);
				BList.expandNode(nextNode, true, false, true, false);
				continue;
			}
		} else {
			console.log("openPath: nextNode is NOT parent");
			//select last one if the last one is not a parent.
			if (OpenPathCtr.dirs.length == 1) {
				console.log("openPath: select last item because it's not a parent: ", nextNode.id);
				BList.selectNode(nextNode);
			}
			return;
		}
	}
}

function openPathAsyncSuccess(event, treeId, treeNode, msg){
	OpenPathCtr.dirs.pop();
	if (OpenPathCtr.dirs.length > 0) {
		nextName = OpenPathCtr.dirs[OpenPathCtr.dirs.length-1];
		nextNode = BList.getNodeByParam("name", nextName, treeNode);
		if (!nextNode.isParent) {
			console.log("openPathAsyncSuccess: " + nextName + " is NOT a parent, could not expand");
			//select last one if the last one is not a parent.
			if (OpenPathCtr.dirs.length == 1) {
				console.log("openPathAsyncSuccess: select last item because it's not a parent: ", nextNode.id);
				BList.selectNode(nextNode);
			}
			return;
		}
		console.log("openPathAsyncSuccess: expanding " + nextNode.id);
		BList.expandNode(nextNode, true, false, true, false);
	} else if (OpenPathCtr.dirs.length == 0) {
		console.log("openPathAsyncSuccess: expand last node success, refreshing");
		refreshBookList();
	} else {
		console.log("openPathAsyncSuccess: OpenPathCtr.dirs.length invalid: " + OpenPathCtr.dirs.length);
	}
}

//refresh node for book-tree and book-list
function refreshNode(tree, node, callback){
	rNode = zTreeGetRootNode(tree);

	var loadIndex = showGlobalLoading();
	if (node.id == rNode.id) {
		//refresh root node
		console.log("refresh root node");
		tree.reAsyncChildNodes(null, "refresh", false, function(){
			refreshBookList();
			expandRoot();
			closeGlobalLoading(loadIndex);
			//延迟一小会儿等 center 的 book-list 渲染好，否则 callback 关于 DOM 的操作会失效
			setTimeout(callback, 100);
		});
	} else {
		console.log("refreshNode: " + node.id);
		tree.reAsyncChildNodes(node, "refresh", null, function(){
			refreshBookList();
			closeGlobalLoading(loadIndex);
			//延迟一小会儿等 center 的 book-list 渲染好，否则 callback 关于 DOM 的操作会失效
			setTimeout(callback, 100);
		});
	}
}

function refreshNodes(tree, nodes) {
	//console.log("refreshNodes: nodes: " + nodes);
	var loadIndex = showGlobalLoading();
	if (nodes.length < 1) {
		console.log("refreshNodes: cancel loading animate");
		closeGlobalLoading(loadIndex);
		return;
	}

	// 刷新后 node 下的所有 node 都会被修改，所以直接使用 nodes 里的 node 来刷新会出错，每次都需要重新 get node
	var node = tree.getNodeByParam("id", nodes[0].id) ;
	if (zTreeIsRootNode(tree, node)) {
		//refresh root node
		console.log("refreshNodes: refresh root node");
		tree.reAsyncChildNodes(null, "refresh", false, function(){
			refreshBookList();
			expandRoot();
			nodes.shift();
			refreshNodes(tree, nodes);
		});
	} else {
		console.log("refreshNodes: " + node.id);
		tree.reAsyncChildNodes(node, "refresh", null, function(){
			refreshBookList();
			nodes.shift();
			refreshNodes(tree, nodes);
		});
	}
}


//user
function goLogin(){
	lm = $("#login-modal")
	lm.on('show.bs.modal', function (e) {unsetAllSK()});
	lm.on('hide.bs.modal', function (e) {initShortcutKey();});
	lm.modal('show');
	lm.on('shown.bs.modal', function(e) {
		$("#login-passwd").focus();
	});
	//$("#login-passwd").focus();
}

function clickUser(){
	console.log("click user");

}

function clickLogin(e){
	if (e.type == "keypress") {
		if (!isKey(e, "keypress", 13)) {
			return;
		}
	}

	var passwd = $("#login-passwd").val();
	console.log("passwd: " + passwd);

	defaultUserLogin(passwd)
}

function defaultUserLogin(passwd){
	console.log("defaultUserLogin");

	lbtn = $("#login-btn");
	url = "/api/user/login/default"
	warn = $("#login-warning");

	lbtn.html("正在登录...");

	$.post(url, {"passwd": passwd}, function(data, status) {
		if (status == "success") {
			console.log("login POST success data: " + data);
			if (data == null) {
				console.log("login failed");
				warn.html("密码对不？");
				lbtn.html("登录");
				return false;
			} else {
				console.log("login success");
				loginSuccess();
				lbtn.html("登录");
				return true;
			}
		} else {
			console.log("login POST failed data: " + data);
			warn.html("登录不了诶，连接状态为：" + status + ", 返回的数据为：" + data);
			lbtn.html("登录");
			return false;
		}
	});
}

function loginSuccess(){
	console.log("hide login-modal")

	warn.html("");
	$("#login-modal").modal('hide');
	showUserBtn();
	initShortcutKey();
}

function defaultUserLogout(){
	console.log("defaultUserLogout");

	url = "/api/user/logout/default"

	$.get(url, function(data, status) {
		if (status == "success") {
			console.log("logout GET success data: " + data);
			showLoginBtn();
		} else {
			console.log("logout GET failed data: " + data);
		}
	});
}

function showUserInfo(){
	$("body").append('<div id="user-info-layer" class="common-layer userInfo"></div>');
	genUserInfo();
	layer.open({
		type: 1,
		title: "用户信息",
		anim: 2,
		area: ['300px', '500px'],
		shade: 0,
		zIndex: 45, // bootstrap modal z-index is 1050, right menu's z-index is 75
		content: $("#user-info-layer"),
	});
}

function genUserInfo(){
	var info = $("#user-info-layer").empty();
	var space = $("<div></div>").attr("id", "user-info-layer-space").append("<span>使用空间:&ensp;</span>");
	var spaceSize = $('<span></span>').append(loadingIconText);
	space.append(spaceSize);
	info.append(space);

	var spaceUrl = "/api/books/booksSpace?path=" + "/";
	$.get(spaceUrl, function(data, status){
		var size =  data;
		if (status != "success") {
			console.log("genUserInfo: get space failed: " + data);
			if (data == "err: exit status 1") {
				size = "路径出错"
			}
		}
		spaceSize.html(size);
	});

	//gen disk usage info
	var disk = $("<div></div>").css({"display": "flex"}).append($('<ul></ul>').addClass("list-group").append($('<li></li>').addClass("list-group-item").css({"padding-left": "0px", "padding-right": "0px"}).html('系统容量:&ensp;')));
	info.append(disk);

	var diskInfo = $('<div></div>');
	disk.append(diskInfo);

	diskInfoUl = $('<ul></ul>').addClass("list-group");
	diskInfoUl.append($('<li></li>').addClass("list-group-item").css({"padding-left": "0px"}).html(loadingIconText));
	diskInfo.append(diskInfoUl);

	var diskUrl = "/api/user/device/disk";
	$.get(diskUrl, function(data, status) {
		diskInfoUl.empty();
		if (status == "success") {
			//$('<li></li>').html("size: " + data.Size);
			diskInfoUl.append($('<li></li>').addClass("list-group-item").css("padding-left", "0px").html("容量: " + data.Size));
			diskInfoUl.append($('<li></li>').addClass("list-group-item").css("padding-left", "0px").html("已用: " + data.Used));
			diskInfoUl.append($('<li></li>').addClass("list-group-item").css("padding-left", "0px").html("可用: " + data.Avail));
			diskInfoUl.append($('<li></li>').addClass("list-group-item").css("padding-left", "0px").html("使用率: " + data.UsePerCent));
		} else {
			diskInfoUl.append($('<li></li>').addClass("list-group-item").css("padding-left", "0px").html("Err: " + data.Err));
		}
	});
	//gen disk usage info end

	var numInfo = $("<p></p>");
	numInfo.append('<span>书籍总数: </span>');
	var num = $('<span></span>').append(loadingIconText);
	numInfo.append(num);
	info.append(numInfo);
	var numUrl = "/api/books/booksNum?/"
	$.get(numUrl, function(data, status){
		num.empty();
		if (status == "success") {
			num.html(data);
		} else {
			num.html("连接错误: " + status);
		}
	});

	return info[0];
}

function showUserBtn(){
	$("#login-icon").hide();
	$("#user-btn-container").show();
}

function showLoginBtn(){
	$("#user-btn-container").hide();
	$("#login-icon").show();
}


//upload
// 上传任务结构体
var UploadTask = {
	id: "",					//a string of time stamp + fullPath
	file: null, 			// File obj
	formData: null,			// formData obj
	relPath: "",			// 上传文件的相对路径，包含文件名
	fullPath: "",			// 上传后的完整路径，fullPath = UploadCxt.taskEntry + "/" + relPath
	override: false,		// 如果服务器上目标文件已存在，是否覆盖目标文件，默认为 false

	xhr: null,				//jquery XMLHttpRequest which used to upload file

	uploadedSize: 0,		// 已上传的文件大小
	progress: 0,			// 上传进度百分比
	speed: 0,				// 上传速度
	avlSpeed: 0,			// 平均速度
	startTime: 0,			// 开始上传的时间
	finishTime: 0,			// 结束上传的时间
	lastUpdateTime: 0,		// 上一次更新进度的时间
	lastUpdatedSize: 0,		// 上一次更新进度时已上传的大小

	result: "",				//result: failed, success
	state: "",				//state: added, uploading, finish
	statusStr: "",			//用以界面显示的状态字符串

	viewStatusId: "",		//DOM element id(used to show task status), == (id + "-status") now
}

// 全局上传控制结构体
var UploadCxt = {
	taskEntry: "",			//上传目录，即要将 taskList 的文件都上传到这个目录，一般时显示右键菜单时的点击目录
	taskList: new Array(),	//UploadTask list
	taskListHTML: new Array(),

	curInstNum: 0,			// current instance num, 当前同时上传的任务数
	maxInstNum: 1,			// max instance num最大同时上传的任务数
}

//新添加的 upload 任务列表，仅包含 task
var UploadNewTaskList = new Array();
var UploadNewTaskListHTML = new Array();

// 构建一个新的 task
function uploadTaskNew(file, relPath) {
	console.log("uploadTaskNew");
	var task = new Object;

	task.file = file;

	formData = new FormData();
	formData.append("uploadFile", file);
	task.formData = formData;

	task.relPath = relPath;
	task.fullPath = UploadCxt.taskEntry + "/" + relPath;

	task.process = 0;
	task.result = "";
	task.state = "added";
	task.statusStr = "waiting";

	var d = new Date();
	t = d.getTime();
	task.id = t + task.fullPath
	task.viewStatusId = task.id + "-status";
	//console.log("uploadAddTask: task.viewStatusId: " + task.viewStatusId);
	return task;
}

//向全局上传控制结构添加一个任务， 并返回新的长度
function uploadAddTask(task){
	len = UploadCxt.taskList.push(task);
	//console.log("uploadAddTask: UploadCxt.taskList.length: ",  len);

	return len;
}

function uploadGetTaskById(taskId){
	//console.log("uploadGetTaskById: taskId: " + taskId);
	for (var i = 0; i < UploadCxt.taskList.length; i++) {
		var task = UploadCxt.taskList[i]
		if (taskId == task.id) {
			return task;
		}
	}
}

// delete task from UploadCxt.taskList
function uploadDelTaskById(taskId){
	console.log("uploadDelTaskById: try to remove taskId: " + taskId);
	for (var i = 0; i < UploadCxt.taskList.length; i++) {
		if (taskId == UploadCxt.taskList[i].id) {
			console.log("uploadDelTaskById: task list len before remove " + taskId + ": " + UploadCxt.taskList.length);
			UploadCxt.taskList.splice(i, 1);
			console.log("uploadDelTaskById: task list len after  remove " + taskId + ": " + UploadCxt.taskList.length);
			return true;
		}
	}
	return false;
}

function uploadCancelTaskById(taskId){
	//console.log("uploadCancelTaskById: taskId: " + taskId);
	var task = uploadGetTaskById(taskId);
	uploadCancelTask(task);
}

// cancel a task, event it's uploading or not yet
function uploadCancelTask(task){
	//console.log("uploadCancelUploadingTask");
	if (task.xhr && task.state == "uploading") {
		task.xhr.abort();
		UploadCxt.curInstNum--;
		uploadRemoveUnfinishedFile(task);
		if (UploadCxt.curInstNum < UploadCxt.maxInstNum) {
			uploadTaskNext();
		}
	}
	
	uploadDelTaskById(task.id);
}

function uploadRemoveUnfinishedFile(task){
	//console.log("uploadRemoveUnfinishedFile");
	console.log("uploadRemoveUnfinishedFile: path: " + task.fullPath);
	booksMgmtRemove(task.fullPath);
}

// 清空任务列表
function uploadClearTask(){
	UploadCxt.taskList = new Array();
	UploadCxt.taskListHTML = new Array();
}

// 清除所有失败的上传任务
function uploadClearFailedTask(){
	for (var i = 0; i < UploadCxt.taskList.length; i++) {
		task = UploadCxt.taskList[i];
		if (task.result == "failed") {
			UploadCxt.taskList.splice(i, 1);
			i--;
		}
	}
}

// 清除所有已完成的上传任务
function uploadClearSuccessTask(){
	for (var i = 0; i < UploadCxt.taskList.length; i++) {
		task = UploadCxt.taskList[i];
		if (task.result == "success") {
			UploadCxt.taskList.splice(i, 1);
			i--;
		}
	}
}

// 清除所有还没开始的上传任务
function uploadClearWaitTask(){
	for (var i = 0; i < UploadCxt.taskList.length; i++) {
		task = UploadCxt.taskList[i];
		if (task.state == "added") {
			UploadCxt.taskList.splice(i, 1);
			i--;
		}
	}
}

// 通过全局上传列表内的 task.id 指定上传一个任务
function uploadTaskById(taskId, override){
	var task = uploadGetTaskById(taskId);
	if (!task) {
		showAlert("task NOT FOUND");
	}

	task.override = override;
	uploadTask(task);
}

function uploadTaskNext(){
	for (var i = 0; i < UploadCxt.taskList.length; i++) {
		task = UploadCxt.taskList[i];
		if (task.state == "added") {
			//立即设置上传状态为 uploading，尽可能避免其它异步上传结束的操作同时检测到该任务未上传
			task.state == "uploading";
			console.log("uploadTaskNext: " + task.id);
			UploadCxt.curInstNum++;
			uploadTask(task);
			return;
		}
	}
}

// 异步上传一个任务
function uploadTask(task){
	//console.log("uploadTask");
	console.log("uploadTask: " + task.id + ", override: " + task.override);
	task.state = "uploading";
	task.statusStr = "uploading"
	isLoginUrl = "/api/user/islogin/default";
	$.get(isLoginUrl, null, function(data, status){
		if (status == "success") {
			login = Boolean(data)
			if (login) {
				if (task.override) {
					uploadTaskRun(task);
				} else {
					uploadTaskCheck(task);
				}
			} else {
				console.log("uploadTask: no login, could not upload");
				task.statusStr = "failed: no login , no BB";
				uploadTaskFailedCallback(task);
				uploadTaskFinish(task);
			}
		} else {
			console.log("uploadTask: check login failed");
			task.statusStr = "failed: check login failed";
			uploadTaskFailedCallback(task);
			uploadTaskFinish(task);
		}	
	});

	uploadViewRefreshTask(task);
	uploadViewRefreshInfo();
}

function uploadTaskCheck(task){
	//console.log("uploadTaskCheck");
	//console.log("uploadTaskCheck: task.relPath: " + task.relPath);
	//console.log("uploadTaskCheck: task.fullPath: " + task.fullPath);

	url = "api/booksMgmt/isExist";
	$.get(url, {path: encodeURIComponent(task.fullPath)}, function(data, status){
		if (status == "success") {
			//console.log("uploadTaskCheck: GET success");
			if (data == "true") {
				console.log("uploadTaskCheck: exist: " + task.fullPath);
				task.statusStr = "failed: target exist";
				uploadTaskFailedCallback(task);
				uploadTaskFinish(task);
			} else if (data == "false"){
				uploadTaskRun(task);
			} else {
				console.log("uploadTaskCheck: server return unknow msg when check file: " + data);
				task.statusStr = "failed: server return unknow msg when check file";
				uploadTaskFailedCallback(task);
				uploadTaskFinish(task);
			}
		} else {
			//console.log("uploadTaskCheck: GET failed");
			task.statusStr = "failed: check file in server failed";
			uploadTaskFailedCallback(task);
			uploadTaskFinish(task);
		}
	});

	uploadViewRefreshTask(task);
	uploadViewRefreshInfo();
}

function uploadTaskRun(task){
	//console.log("uploadTaskRun");
	console.log("uploadTaskRun: " + task.file.name);
	var taskXhr;
	var d = new Date();
	task.startTime = d.getTime()
	task.lastUpdateTime = task.startTime;

	var uploadUrl;
	
	if (task.file.webkitRelativePath) {
		savePath = UploadCxt.taskEntry;
	} else {
		savePath = task.fullPath.substr(0, task.fullPath.lastIndexOf("/"));
	}
	if (task.override) {
		uploadUrl = "/api/booksMgmt/upload?path=" + encodeURIComponent(savePath) + "&override=true"; 
	} else {
		uploadUrl = "/api/booksMgmt/upload?path=" + encodeURIComponent(savePath);
	}

	task.xhr = $.ajax({
		url: uploadUrl, 
		type: "POST", 
		data: task.formData, 
		processData: false, 
		contentType: false, 
		xhr: function(){
			return uploadTaskXhr(task);
		},
		success: function(response, status){
			//console.log("uploadTask: POST success response: " + response);
			if (response != "") {
				task.statusStr = "failed: " + response;
				uploadTaskFailedCallback(task);
			} else {
				uploadTaskSuccessCallback(task);
			}
		},
		error: function(xhr, status, err) {
			task.statusStr = "connext failed: " + status + ", err: " + err;
			uploadTaskFailedCallback(task);
		},
		complete: function(xhr, status){
			uploadTaskFinish(task);
			
		},
	});
}

function uploadTaskXhr(task){
	uploadXhr = $.ajaxSettings.xhr();
	if (uploadXhr.upload) {
		uploadXhr.upload.addEventListener('progress', function(e) {
			if (e.lengthComputable) {
				//var percent = Math.floor(e.loaded/e.total*100);
				var percent = (e.loaded/e.total*100).toFixed(2);
				//console.log("upload percent: " + percent);
				task.progress = percent;
				task.uploadedSize = e.loaded;

				var d = new Date();
				now = d.getTime();
				task.speed = (e.loaded - task.lastUpdatedSize)/((now - task.lastUpdateTime)/1000);
				task.avlSpeed = e.loaded/((now - task.startTime)/1000);

				task.lastUpdatedSize = e.loaded;
				task.lastUpdateTime = d.getTime();
				uploadViewRefreshStatus(task);
			}
		}, false);
	}
	return uploadXhr;
}

function uploadTaskFinish(task){
	console.log("uploadTaskFinish: " + task.id);
	task.state = "finish";
	var d = new Date();
	task.finishTime = d.getTime()
	task.lastUpdateTime = task.finishTime;
	task.avlSpeed = task.file.size/((task.finishTime - task.startTime)/1000);

	uploadViewRefreshTask(task);
	uploadViewRefreshInfo();

	UploadCxt.curInstNum--;
	if (UploadCxt.curInstNum < UploadCxt.maxInstNum) {
		uploadTaskNext();
	}
}

function uploadTaskFailedCallback(task){
	task.result = "failed"
 }

function uploadTaskSuccessCallback(task){
	task.result = "success";
	task.statusStr = "success";
}

// work on upload new list
function clearUploadNewTaskList(){
	UploadNewTaskList = new Array();
	UploadNewTaskListHTML = new Array();
}

//上传新添加的文件列表 UploadNewTaskList
function uploadClickUploadNewTaskList(){
	console.log("uploadClickUploadNewTaskList");

	uploadModalHide();
	//uploadViewTaskListClear();
	uploadViewTaskShow();
	//uploadViewTaskListClear();
	UploadCxt.taskList = UploadCxt.taskList.concat(UploadNewTaskList);
	console.log("uploadClickUploadNewTaskList: UploadCxt.taskList: " + UploadCxt.taskList.length);

	var override = document.getElementById("upload-override-all").checked;
	console.log("uploadClickUploadNewTaskList: override: " + override);

	for (var i = 0; i < UploadNewTaskList.length; i++) {
		task = UploadNewTaskList[i];
		task.override = override;
		uploadViewAppendTaskShow(task);
		if (UploadCxt.curInstNum < UploadCxt.maxInstNum) {
			UploadCxt.curInstNum++;
			uploadTask(task);
		}
	}
	clearUploadNewTaskList();
}

//通过 选择文件 按钮添加文件
function uploadAddFile() {
	console.log("uploadAddFile");
	file = document.getElementById("upload-file-elem").files[0];

	var task = uploadTaskNew(file, file.name);
	if (!uploadCheckItem(task)) {
		return;
	}

	UploadNewTaskList.push(task);
	uploadNewListViewPrependItem(task);
	uploadNewListViewRefreshCount();
	uploadNewListViewShow();
}

//通过 选择文件夹 按钮添加目录
function uploadAddDir(ele){
	console.log("uploadAddDir");
	var files = ele.files;

	for (var i = 0; i < files.length; i++) {
		var task = uploadTaskNew(files[i], files[i].webkitRelativePath);
		if (!uploadCheckItem(task)) {
			continue;
		}

		UploadNewTaskList.push(task);
		setTimeout(uploadNewListViewRefreshCount(), 500);
		uploadNewListViewPrependItem(task);
	}
	uploadNewListViewShow();
}

//拖拽文件或目录
var BLCDrapPath;
function BLCDragEnter(ev) {
	console.log("BLCDragEnter");
	console.log("BLCDragEnter: taget: " + ev.target.id);
	ev.preventDefault();

	var blc = $("#book-list-container");
	blc.css("border-color", "transparent");

	clearSelectedBookListItem();
	
	var holder;
	if (ev.target.id != "book-list-container" && $(ev.target).parents(".isDir").length > 0) {
		holder = $(ev.target).parents(".isDir");
		seBLItem = holder;
		var prefix = "dir-";
		BLCDrapPath = holder.attr("id").substr(prefix.length);
	} else {
		holder = blc;
		BLCDrapPath = Hist.visitedIds[Hist.curIndex];
	}

	holder.css({"border": "solid 1px #99d1ff"});
	selectBookListItem(seBLItem);

	console.log("upload to dir: " + BLCDrapPath);
}
function uploadDragEnter(ev) {
	console.log("uploadDragEnter");
	console.log("uploadDragEnter: taget: " + ev.target.id);
	ev.preventDefault();

	holder = $("#upload-holder");
	holder.css("border-color", "#286090");
}
function uploadDragLeave(ev) {
	console.log("uploadDragLeave");
	console.log("uploadDragLeave: taget: " + ev.target.id);
	ev.preventDefault();

	if (ev.target.id == "upload-holder") {
		holder = $("#upload-holder");
		holder.css("border-color", "#ccc");
	}
	
}
function BLCDragLeave(ev) {
	console.log("BLCDragEnter");
	console.log("BLCDragEnter: taget: " + ev.target.id);
	ev.preventDefault();

	if (ev.target.id == "book-list-container" || ev.target.id == "book-list") {
		holder = $("#book-list-container");
		holder.css("border-color", "transparent");
		clearSelectedBookListItem();
	}
}
// In order to have the drop event occur on a div element, must cancel the ondragenter and ondragover events
function uploadDragOver(ev) {
	ev.preventDefault();
}
function BLCDragOver(ev) {
	console.log("BLCDragOver");
	ev.preventDefault();
}
function uploadDrop(ev){
	console.log("uploadOnDrop");
	ev.preventDefault();
	ev.stopPropagation();

	holder = $("#upload-holder");
	holder.css("border-color", "#ccc");
	
	var holder = document.getElementById("upload-holder");

	var items = ev.dataTransfer.items;
	console.log("items: " + items.length);
	uploadScanFilesCount = 0
	for (i = 0; i < items.length; i++) {
		var entry = items[i].webkitGetAsEntry();
		if (!entry) {
			continue;
		}
		uploadScanFiles(entry);
	}
}
function BLCDrop(ev){
	console.log("BLCDrop");
	ev.preventDefault();
	ev.stopPropagation();

	holder = $("#book-list-container");
	holder.css("border", "0px");

	clickGoUpload(BLCDrapPath);

	var items = ev.dataTransfer.items;
	console.log("items: " + items.length);
	uploadScanFilesCount = 0
	for (i = 0; i < items.length; i++) {
		var entry = items[i].webkitGetAsEntry();
		if (!entry) {
			continue;
		}
		uploadScanFiles(entry);
	}
}

//用以递归扫描计数，以确定递归是否结束
var uploadScanFilesCount = 0;
function uploadScanFiles(item) {
	//console.log("uploadScanFiles: fullPath: " + "/" + item.fullPath);
	uploadScanFilesCount++;
	if (item.isDirectory) {
		uploadScanFilesCount--;
		var directoryReader = item.createReader();
		directoryReader.readEntries(function(entries) {
			entries.forEach(function(entry){
				uploadScanFiles(entry)
			});
		});
	} else {
		// add item to UploadNewTaskList
		item.file(function(file){
			//console.log("uploadScanFiles: item.fullPath: " + item.fullPath);
			if (item.fullPath.substr(0, 1) == "/") {
				relPath = item.fullPath.replace("/", "");
			} else {
				relPath = item.fullPath;
			}
			
			//由于直接选择的目录中文件的 relPath 是相对路径，后端可以读取这个路径，所以上传参数的 path 只有 UploadCxt.taskEntry，而拖动的目录内的文件没有 webkitPath， 后端读取不到相对路径，所以将相对路径放到 UploadCxt.taskEntry
			//relPath = relPath.substr(0, relPath.lastIndexOf("/"));
			//console.log("uploadScanFiles: relPath: " + relPath);
			//console.log("uploadScanFiles: file.name: " + file.name);
			var task = uploadTaskNew(file, relPath);
			if (!uploadCheckItem(task)) {
				return;
			}
			len = UploadNewTaskList.push(task);
			uploadNewListViewPrependItem(task);
			uploadNewListViewRefreshCount();

			uploadScanFilesCount--;
			//递归循环处理完最后一个文件，将所有生成的文件条目显示出来
			//console.log("uploadScanFiles: uploadScanFilesCount: " + uploadScanFilesCount);
			if (uploadScanFilesCount == 0) {
				uploadNewListViewShow();
			}
		});
	}
}


function uploadCheckItem(task) {
	//console.log("uploadCheckItem");
	//console.log("uploadCheckItem: task.fullPath: " + task.fullPath);
	for (var i = 0; i < UploadNewTaskList.length; i++) {
		if (task.fullPath == UploadNewTaskList[i].fullPath) {
			//console.log("uploadCheckItem: ignore dup item: " + task.fullPath);
			return false;
		}
	}

	return true;
}

function uploadNewListRefreshList(){
	console.log("uploadNewListRefreshList");
	UploadNewTaskListHTML = new Array();
	var ulc = $("#upload-new-task-list");
	ulc.html("");

	for (var i = 0; i < UploadNewTaskList.length; i++) {
		task = UploadNewTaskList[i];
		uploadNewListViewPrependItem(task);
	}

	uploadNewListViewShow();
}

function uploadNewListViewGenItem(index, task) {
	//console.log("uploadNewListViewGenItem");
	//console.log("uploadNewListViewGenItem: task: " + task.fullPath);
	indexStr = index + ": "
	/*
	var item = $("<div></div>").addClass("upload-task-item");

	var title = $("<div></div>").html(indexStr + task.relPath);
	item.append(title);

	var right = $("<div></div>").addClass("upload-task-item-right");
	var size = $("<span></span>").html(getFileSizeStr(task.file.size));
	right.append(size);
	closeBtn = $("<span></span>").addClass("glyphicon glyphicon-remove upload-task-item-common upload-task-item-btn").attr("aria-hidden", "true").attr("title", "将文件移出上传列表");
	closeFunc = "uploadNewListClickDelItem(\'" + task.fullPath + "\')";
	closeBtn.attr("onclick", closeFunc)
	right.append(closeBtn);
	item.append(right);
	*/
	var item = "<div class=\"upload-task-item\"><div>" + indexStr + task.file.name + "</div><div class=\"upload-task-item-right\"><span>" + getFileSizeStr(task.file.size) + "</span><span class=\"glyphicon glyphicon-remove upload-task-item-common upload-task-item-btn\" aria-hidden=\"true\" onclick=\"uploadNewListClickDelItem(\'" + task.fullPath + "\')\" title=\"将文件移出上传列表\"></span></div></div>"
	return item;
}

function uploadNewListViewPrependItem(task){
	//console.log("uploadNewListViewPrependItem: prepend: " + task.fullPath);
	var item = uploadNewListViewGenItem(UploadNewTaskList.length, task);
	UploadNewTaskListHTML.unshift(item);
}

function uploadNewListViewShow(){
	console.log("uploadNewListViewShow");
	var ulc = $("#upload-new-task-list");
	ulc.html(UploadNewTaskListHTML);
}

function uploadNewListViewRefreshCount(){
	//console.log("uploadNewListViewRefreshCount");
	//console.log("uploadNewListViewRefreshCount: num: " + UploadNewTaskList.length);
	var elem = $("#upload-new-task-list-count");
	if (UploadNewTaskList.length == 0) {
		elem.html("");
		return;
	}
	//console.log("uploadNewListViewRefreshCount: elem.html: " + elem.html());
	elem.html(UploadNewTaskList.length);
}
function uploadNewListClickDelItem(fullPath) {
	console.log("uploadNewListClickDelItem");
	console.log("uploadNewListClickDelItem:  fullPath: " + fullPath);
	uploadNewTaskListDelItem(fullPath);
	
	uploadNewListRefreshList();
}

//remove an item from UploadNewTaskList
function uploadNewTaskListDelItem(taskFullPath){
	//console.log("uploadRemoveListItem");
	console.log("uploadRemoveNewTaskListItem: taskFullPath: " + taskFullPath);
	for (var i = 0; i < UploadNewTaskList.length; i++) {
		task = UploadNewTaskList[i];
		if (taskFullPath == task.fullPath) {
			UploadNewTaskList.splice(i, 1);
			console.log("uploadRemoveNewTaskListItem: removed");
			return true;
		}
	}
	return false;
}
// upload new list end

//upload view
// 刷新上传界面
function uploadViewRefresh(){
	uploadViewRefreshInfo();
	uploadViewRefreshList();
	uploadViewShow();
}

function uploadViewRefreshList(){
	console.log("uploadViewRefreshList");

	//console.log("uploadViewRefreshList: UploadCxt.taskList: " + UploadCxt.taskList.length);
	UploadCxt.taskListHTML = new Array();
	var list = $("#upload-task-list");
	list.html("");

	for (var i = 0; i < UploadCxt.taskList.length; i++) {
		var item = uploadViewGenItem(UploadCxt.taskList[i], i+1);
		UploadCxt.taskListHTML.push(item);
	}
}

function uploadViewRefreshListIndex(){
	//console.log("uploadViewRefreshListIndex");
	var list = $("#upload-task-list");
	items = list.children();
	for(i = 0; i < items.length; i++) {
		item = $(items[i]);
		index = item.children(".upload-task-item-index");
		index.html(i+1);
	}
}

function uploadViewShow(){
	var list = $("#upload-task-list");
	list.html(UploadCxt.taskListHTML);
}

// 根据 task 生成对应的 HTML item，并添加到 UploadCxt.taskListHTML， 并立即显示出来
function uploadViewAppendTaskShow(task) {
	console.log("uploadViewAppendTaskShow");

	var list = $("#upload-task-list");
	var item = uploadViewGenItem(task, UploadCxt.taskListHTML.length + 1);
	len = UploadCxt.taskListHTML.push(item);

	list.append(item);
}

function uploadViewGenItem(task, index){
	//console.log("uploadViewGenItem");
	var item = $("<div></div>").addClass("upload-task-item").attr("id", task.id);
	uploadViewFillItem(item, task, index);
	return item;
}

function uploadViewFillItem(item, task, index){
	//console.log("uploadViewFillItem");
	//console.log("uploadViewFillItem: index: " + index);
	var index = $("<div></div>").html(index).addClass("upload-task-item-index");
	item.append(index);

	lastSplash = task.fullPath.lastIndexOf("/");
	var titleBar = $("<div></div>").addClass("upload-task-item-titleBar");
	var title = $("<div></div>").html(task.file.name).addClass("upload-task-item-title");
	titleBar.append(title);

	var ctrl = $("<div></div>");
	if (task.result == "failed") {
		var retryBtn = $("<span></span>").addClass("disable glyphicon upload-task-item-common upload-task-item-btn").attr("aria-hidden", "true");
		if (task.statusStr == "failed: target exist") {
			retryBtn.addClass("glyphicon-transfer").attr("title", "重新上传并覆盖已有文件").attr("onclick", "uploadClickRetryTask(this, true)");
		} else {
			retryBtn.addClass("glyphicon-repeat").attr("title", "重试").attr("onclick", "uploadClickRetryTask(this, false)");
		}
		ctrl.append(retryBtn);
	}

	closeBtn = $("<span></span>").addClass("glyphicon glyphicon-remove upload-task-item-common upload-task-item-btn").attr("aria-hidden", "true").attr("onclick", "uploadClickCancelTask(this)").attr("title", "移除任务");
	ctrl.append(closeBtn);
	titleBar.append(ctrl);

	var pathInfo = $("<div></div>").html("To: " + task.fullPath.substr(0, lastSplash)).addClass("small").addClass("upload-task-item-pathInfo");

	var uploadStatus = uploadViewGenStatus(task);

	var container = $("<div></div>").addClass("upload-task-item-container");
	container.append(titleBar).append(pathInfo).append(uploadStatus);

	//var size = $("<span></span>").addClass("upload-task-item-common").html(getFileSizeStr(task.file.size));
	item.append(container);

}

function uploadViewRefreshTask(task) {
	//console.log("uploadViewRefreshTask");
	var elem = $(document.getElementById(task.id));
	index = elem.children(".upload-task-item-index").html();
	elem.empty();
	uploadViewFillItem(elem, task, index);
}

// task: task of UploadTask
function uploadViewRefreshStatus(task){
	uploadStatus = $(document.getElementById(task.viewStatusId));
	uploadStatus.html("");
	uploadViewFillStatus(uploadStatus, task);
}

function uploadViewGenStatus(task) {
	uploadStatus = $("<div></div>").attr("id", task.viewStatusId);
	uploadViewFillStatus(uploadStatus, task);
	return uploadStatus;	
}

function uploadViewFillStatus(uploadStatus, task) {
	progress = $("<div></div>").addClass("progress").addClass("uploadProgress");
	bar = $("<div></div>").addClass("progress-bar").addClass("progress-bar-striped").addClass("active");
	bar.attr("role", "progressbar").attr("aria-valuemin", "0").attr("aria-valuemax", "100");
	bar.attr("aria-valuenow", task.progress).attr("style", "width: " + task.progress + "%");
	if (task.result == "success") {
		bar.addClass("progress-bar-success");
		bar.html("success");
		bar.removeClass("active");
	} else {
		bar.html(task.progress + "%");
		
	}
	progress.append(bar);


	var ctrlInfo = $("<div></div>").addClass("upload-task-item-ctrlInfo").addClass("small");

	var size = $("<div></div>").addClass("upload-task-item-ctrlInfo-item").addClass("text-left");
	size.html(getFileSizeStr(task.uploadedSize) + "/" + getFileSizeStr(task.file.size));

	var speed = $("<div></div>").addClass("upload-task-item-ctrlInfo-item").addClass("text-center");
	if (task.state == "uploading") {
		speed.html(getFileSizeStr(task.speed) + "/s");
	} else if (task.state == "added") {
		speed.html("wait");
	} else if (task.state == "finish") {
		speed.html("平均速度: " +  getFileSizeStr(task.avlSpeed) + "/s");
	}

	var time = $("<div></div>").addClass("upload-task-item-ctrlInfo-item").addClass("text-right");
	time.html(getTimeStr(parseInt((task.lastUpdateTime - task.startTime)/1000)) + "/" + getTimeStr(task.file.size/task.avlSpeed));

	ctrlInfo.append(size).append(speed).append(time);


	uploadStatus.append(progress);
	uploadStatus.append(ctrlInfo);

	if (task.result == "failed") {
		var errInfo = $("<div></div>").addClass("upload-task-item-err").addClass("small");
		errInfo.text(task.statusStr);
		uploadStatus.append(errInfo);
	}
}

function uploadViewRefreshInfo(){
	//console.log("uploadViewRefreshInfo");
	var info = $("#upload-task-info");
	info.empty();

	var waitNum = 0;
	var uploadNum = 0;
	var successNum = 0;
	var failedNum = 0;
	for (var i = 0; i < UploadCxt.taskList.length; i++) {
		task = UploadCxt.taskList[i];
		//added, uploading, finish
		if (task.state == "added") {
			waitNum++;
		} else if (task.state == "uploading") {
			uploadNum++;
		}

		if (task.result == "success") {
			successNum++;
		} else if (task.result == "failed") {
			failedNum++;
		}
	}

	var elemAll = $("<div></div>").html("All: " + UploadCxt.taskList.length);
	var elemWait = $("<div></div>").html("Wait: " + waitNum);
	var elemUpload = $("<div></div>").html("Uploading: " + uploadNum);
	var elemSuccess = $("<div></div>").html("Success: " + successNum);
	var elemFailed = $("<div></div>").html("failed: " + failedNum);
	info.append(elemAll, elemWait, elemUpload, elemSuccess, elemFailed);
}

function uploadViewTaskListClear() {
	console.log("uploadViewTaskListClear");
	list = $("#upload-task-list");
	list.html("");
}

// 显示左下角的上传管理面板
function uploadViewTaskShow(){
	console.log("uploadViewTaskShow");
	var t = '\
		<div id="upload-task-hdr">\
			<div id="upload-task-ctrl">\
				<div id="upload-ctrl-btn-container" class="dropdown" style="margin-left: -20px;">\
					<button class="common-btn" style="padding-top: 0em; padding-bottom: 0em" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">\
						<span class="glyphicon glyphicon-option-vertical" aria-hidden="true"></span>\
					</button>\
					<ul class="dropdown-menu" aria-labelledby="user-btn">\
						<li><a href="#" onclick="uploadClickClearTaskAll()" title="清空所有任务，正在上传的任务在清空后不会终止上传，未上传的任务将被终止">清空</a></li>\
						<li><a href="#" onclick="uploadClickClearTaskFailed()" title="清空失败的任务">清空失败任务</a></li>\
						<li><a href="#" onclick="uploadClickClearTaskWait()" title="清空未开始的任务">清空未开始任务</a></li>\
						<li><a href="#" onclick="uploadClickClearTaskSuccess()" title="清空已完成的任务">清空已完成任务</a></li>\
						<li role="separator" class="divider"></li>\
						<li><a href="#" onclick="uploadClickRetryAll()" title="全部重试失败的任务">全部重试</a></li>\
						<li><a href="#" onclick="uploadClickRetryOverrideAll()" title="全部重传任务，如果目标文件已存在则覆盖">全部覆盖重传</a></li>\
					</ul>\
				</div>\
			</div>\
			<div id="upload-task-info-container">\
				<div id="upload-task-info">\
					<div>All: 0</div>\
					<div>Wait: 0</div>\
					<div>Uploading: 0</div>\
					<div>Success: 0</div>\
					<div>Failed: 0</div>\
				</div>\
			</div>\
		</div>'

	layer.open({
		type: 1,
		title: t,
		move: '#upload-task-info-container',
		//skin: 'layui-layer-demo',
		anim: 2,
		area: ['800px', '520px'],
		//offset: 'rb',
		maxmin: true,
		shade: 0,
		zIndex: 50, // bootstrap modal z-index is 1050, right menu's z-index is 75
		content: $("#upload-task-container"),
		success: function(layero, index){
			var el = $(layero);
			el.css("min-width", "500px");
			var setWin = el.children(".layui-layer-title");
			setWin.css("overflow", "visible");
			uploadViewTaskShowResetHeight(layero);
		},
		resizing: function(layero){uploadViewTaskShowResetHeight(layero)},
		full: function(layero){uploadViewTaskShowResetHeight(layero)},
		min: function(layero){
			var el = $(layero);
			setTimeout(function() {el.css("width", "800px")}, 10);
		},
		restore: function(layero){uploadViewTaskShowResetHeight(layero)},
	});


}
function uploadViewTaskShowResetHeight(layero) {
	var el = $(layero);
	//console.log("el.height(): " + el.height());
	tEl = $(el.children(".layui-layer-title"));
	//console.log("tEl.height(): " + tEl.height());
	layerContent = $(el.children(".layui-layer-content"));
	taskList = $("#upload-task-list-container");
	var h = (el.height()-tEl.height());
	console.log("uploadViewTaskShowResetHeight: height: " + h);
	taskList.css("height", h + "px");
	layerContent.css("height", h + "px");

}

function uploadViewTaskHide(){
	console.log("uploadTaskClose");
	$("#upload-task-container").fadeOut("fast");
}

function uploadClickCancelTask(ele){
	console.log("uploadClickCancelTask");
	closeBtn = $(ele);
	item = closeBtn.parent().parent().parent().parent();
	taskId = item.attr("id");

	//从全局上传任务列表中移除当前任务
	uploadCancelTaskById(taskId);
	if (UploadCxt.taskList.length == 0) {
		uploadViewRefresh();
		return;
	}

	item.remove();
	uploadViewRefreshListIndex();
	uploadViewRefreshInfo();
}

function uploadClickRetryTask(ele, override){
	var taskId = $(ele).parent().parent().parent().parent().attr("id");
	console.log("uploadClickRetryTask: " + taskId);
	var task = uploadGetTaskById(taskId);
	task.state = "added"
	task.statusStr = "waiting";
	task.result = "";
	task.override = override;
	if (UploadCxt.curInstNum < UploadCxt.maxInstNum) {
		UploadCxt.curInstNum++;
		uploadTask(task);
	}
}

function uploadClickRetryAll(){
	console.log("uploadClickRetryAll");
	for (var i = 0; i < UploadCxt.taskList.length; i++) {
		var task = UploadCxt.taskList[i];
		if (task.result == "failed" || task.state == "uploading") {
			task.state = "added"
			task.statusStr = "waiting";
			task.result = "";
			task.override = false;
			if (UploadCxt.curInstNum < UploadCxt.maxInstNum) {
				UploadCxt.curInstNum++;
				uploadTask(task);
			}
		}
	}
	uploadViewRefresh();
}

function uploadClickRetryOverrideAll(){
	console.log("uploadClickRetryOverrideAll");
	for (var i = 0; i < UploadCxt.taskList.length; i++) {
		var task = UploadCxt.taskList[i];
		if (task.result == "failed" || task.state == "uploading") {
			task.state = "added"
			task.statusStr = "waiting";
			task.result = "";
			task.override = true;
			if (UploadCxt.curInstNum < UploadCxt.maxInstNum) {
				UploadCxt.curInstNum++;
				uploadTask(task);
			}
		}
	}
	uploadViewRefresh();
}

function uploadClickClearTaskAll(){
	console.log("uploadClickClearTaskAll");
	uploadClearTask();
	uploadViewRefresh();
}

function uploadClickClearTaskWait(){
	console.log("uploadClickClearTaskWait");
	uploadClearWaitTask();
	uploadViewRefresh();
}

function uploadClickClearTaskFailed(){
	console.log("uploadClickClearTaskFailed");
	uploadClearFailedTask();
	uploadViewRefresh();
}

function uploadClickClearTaskSuccess(){
	console.log("uploadClickClearTaskSuccess");
	uploadClearSuccessTask();
	uploadViewRefresh();
}

function uploadModalHide(){
	console.log("uploadModalHide");
	$("#upload-modal").modal('hide');
}
//upload end


//shortcutKey
function BTreeShortCutKey(ev){
	//console.log("BTreeShortCutKey");
	if (!ev) {
		console.log("BTreeShortCutKey: no event");
		return;
	}
	keyNum = getKeyNum(ev);
	console.log("BTreeShortCutKey: keyNum: " + keyNum);
	switch (keyNum) {
		//F2 rename
		case 113:
			RenameByTSK(ev);
			break;

		//ctrl+x, cut
		case 88:
			if (ev.ctrlKey) {
				console.log("BTreeShortCutKey: cut");
				CutByTSK(ev);
			}
			break;

		//ctrl+c, copy
		case 67:
			if (ev.ctrlKey) {
				console.log("BTreeShortCutKey: copy");
				CopyByTSK(ev);
			}
			break;

		//del, delete file/dir
		case 46:
			removeByTSK(ev);
			break;

		default:
			//console.log("BTreeShortCutKey: unsupport shortcutKey: " + keyNum);
	}
}
function centerShortCutKey(ev){
	//console.log("centerShortCutKey");
	if (!ev) {
		console.log("centerShortCutKey: no event");
		return;
	}
	keyNum = getKeyNum(ev);
	console.log("centerShortCutKey: keyNum: " + keyNum);
	switch (keyNum) {
		//F2 rename
		case 113: 
			RenameByCSK(ev);
			break;

		//ctrl+x, cut
		case 88:
			if (ev.ctrlKey) {
				console.log("centerShortCutKey: cut");
				CutByCSK(ev);
			}
			break;

		//ctrl+c, copy
		case 67:
			if (ev.ctrlKey) {
				console.log("centerShortCutKey: copy");
				CopyByCSK(ev);
			}
			break;

		//del, delete file/dir
		case 46:
			removeByCSK(ev);
			break;

		default:
			//console.log("centerShortCutKey: unsupport shortcutKey: " + keyNum);
	}
}
function bodyShortCutKey(ev) {
	//console.log("bodyShortCutKey");
	if (!ev) {
		console.log("bodyShortCutKey: no event");
		return;
	}
	keyNum = getKeyNum(ev);
	console.log("bodyShortCutKey: keyNum: " + keyNum);
	switch (keyNum) {
		//ctrl+v, paste
		case 86:
			if (ev.ctrlKey) {
				console.log("bodyShortCutKey: paste");
				pasteBySK(ev);
			}
			break;

		//esc, 关闭 tips 和 dialog 类型的窗口
		case 27:
			layer.closeAll("tips");
			layer.closeAll("dialog");
		default:
			//console.log("bodyShortCutKey: unsupport shortcutKey: " + keyNum);
	}
}
//shortcutKey end

// 搜索输入框中阻止事件冒泡，避免快捷键冲突
function searchInputShortCutKey(ev) {
	stopPropagation(ev);
}

//common function
function getKeyNum(event){
	if (event.which) {
		return event.which
	} else if (event.keyCode) {
		return event.keyCode;
	}
	return null;
}

// check specified key for keyboard event
// type: keypress, keydown, keyup
function isKey(event, type, keyNum) {
	if (event.type != type) {
		return false;
	}

	if (getKeyNum(event) == keyNum) {
		return true;
	} else {
		return false;
	}
}

function getFileSizeStr(size){
	//console.log("getFileSizeStr");
	ksize = size/1024;
	if (ksize < 1) {
		return size.toFixed(0) + "B";
	}

	msize = ksize/1024;
	if (msize < 1) {
		return ksize.toFixed(0) + "KB";
	}

	gsize = msize/1024;
	if (gsize < 1) {
		return msize.toFixed(2) + "MB"
	}

	tsize = gsize/1024;
	if (tsize < 1) {
		return gsize.toFixed(3) + "GB"
	}

	return size;
}

function getTimeStr(seconds){
	//console.log("getFileSizeStr");
	seconds = parseInt(seconds);
	m = parseInt(seconds/60);
	if (m < 1) {
		return seconds + "s";
	}
	s = seconds%60;

	h = parseInt(m/60);
	if (h < 1) {
		return m.toString() + "m" + s + "s";
	}
	m = m % 60;

	d = h/24;
	if (d < 1) {
		return h + "h" + m + "m" + s + "s";
	}

	return ">1d"
}

function isLogin(loginCallback, logoutCallback){
	console.log("isLogin");
	isLoginUrl = "/api/user/islogin/default";
	$.get(isLoginUrl, null, function(data, status){
		if (status == "success") {
			login = Boolean(data)
			console.log("islogin: " + login)
			if (login) {
				if (loginCallback) {
					loginCallback();
					return;
				}
			}
		} else {
			console.log("isLogin: status: " + status)
		}
		if (logoutCallback) {
			logoutCallback();
		}
	});
}

// var m = new modalPage(id, title);
// 设置按钮文字： m.Btn.html("Do");
// 添加中间内容: var info = $("#info"); m.body.appen(info);
function modalPage(id, title){
	this.dialog = $("<div></div>").attr("id", id);
	this.dialog.addClass("modal fade").attr("tabindex", "-1").attr("role", "dialog");
	this.dialog.on('show.bs.modal', function (e) {unsetAllSK()});
	this.dialog.on('hide.bs.modal', function (e) {initShortcutKey();});
	$("body").append(this.dialog);

	this.doc = $("<div></div>").attr("role", "document").addClass("modal-dialog");
	this.dialog.append(this.doc);

	this.content = $("<div></div>").addClass("modal-content");
	this.doc.append(this.content);

	var hdr = $("<div></div>").addClass("modal-header");
	//console.log("modalPage: this.title: " + this.title);
	this.titleElem = $('<h4 class="modal-title"></h4>');
	this.titleElem.html(title);
	hdr.html('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>');
	hdr.append(this.titleElem);
	this.content.append(hdr);

	this.body = $("<div></div>").addClass("modal-body");
	this.content.append(this.body);

	this.footer = $("<div></div>").addClass("modal-footer");
	this.Btn = $('<button type="button" class="btn btn-primary"></button>')
	this.footer.html('<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>');
	this.footer.append(this.Btn);
	this.content.append(this.footer);

	this.show = show;
	function show(){this.dialog.modal('show')}

	this.hide = hide;
	function hide(){this.dialog.modal('hide')}

	this.remove = remove;
	function remove(){this.dialog.remove(); $(".modal-backdrop").hasClass("fade").hasClass("in").remove()}

	this.setTitle = setTitle;
	function setTitle(t){console.log("setTitle: t: " + t);this.titleElem.html(t)};
}

function showGlobalLoading(){
	return layer.load(0, {shade: false});
}

function closeGlobalLoading(index){
	layer.close(index);
}

//icon: 0: info, 1: success, 2: error, 3: unknow, 4: lock, 5: sad, 6: happy, 7: download
function showAlert(content, title, icon){
	return layer.alert(content, {title: title, icon: icon, shadeClose: true,});
}

function closeAlert(index){
	layer.close(index);
}

function showTips(content, id) {
	console.log("showTips: content: " + content + " id: " + id)
	layer.tips(content, "#" + id);
}

function closeTips(index) {
	layer.close(index);
}

var loadingIcon = '<img src="/static/img/common/loading.gif" class="loading"/>';
var loadingIconText = '<img src="/static/img/common/loading.gif" class="textLoading"/>';

function getNodeByCurCenterElem(el) {
	return getNodeByCenterElem(seBLItem);
}
function getNodeByCenterElem(el){
	var el = $(el);
	var id;
	var prefix;
	if (el.hasClass("isBook")) {
		prefix = "book-"
	} else if (el.hasClass("isDir")) {
		prefix = "dir-"
	} else {
		console.log("getNodeByCenterElem: get elem type failed");
		return;
	}

	id = el.attr("id");
	id = id.substr(prefix.length);
	//console.log("getNodeByCenterElem: getting id: " + id);

	var node = BList.getNodeByParam("id", id);
	if (!node) {
		console.log("getNodeByCenterElem: get node failed");
		return;
	}

	//console.log("getNodeByCenterElem: node.id: " + node.id);
	return node;
}
function getCenterElemByNode(node){
	var id;
	if (node.bookInfo && node.bookInfo.IsBook) {
		id = "book-" + node.id;
	} else {
		id = "dir-" + node.id;
	}

	//console.log("getCenterElemByNode: id: " + id);
	var el = $("#" + id);
	//console.log("getCenterElemByNode: el id: " + el.attr("id"));
	domEl = document.getElementById(id);
	//console.log("getCenterElemByNode: domEl.id: " + domEl.id);
	return el;
}
function selectCenterElemByNode(node){
	//console.log("selectCenterElemByNode: node.id: " + node.id);
	var el = getCenterElemByNode(node);
	seBLItem = el;
	selectBookListItem(el);
}
function selectCenterElemById(id){
	//console.log("selectCenterElemById: id: " + id);
	var node = BList.getNodeByParam("id", id);
	//console.log("selectCenterElemById: node.id: " + node.id);
	selectCenterElemByNode(node);
}

function cleanPath(path){
	//console.log("cleanPath: path: " + path);
	if (!path) {
		console.log("invalid path");
		return;
	}

	//去除前后空格
	var p = path.trim();

	// 删除开头的 ./
	p = p.replace(/^\.\//, "");

	// 将连续的多个 // 合并为为一个
	p = p.replace(/\/\/+/g, "/");

	// 删除结尾的 /
	p = p.replace(/\/$/, "");

	//console.log("cleanPath: p: " + p);
	return p
}

function stopDefault(e) {
	var e = e || window.event;
	if (e && e.preventDefault){
		e.preventDefault();
	}else{
		e.returnValue = false;
	}
	return false;
}

function stopPropagation(e) {
	console.log("stopPropagation");
	var e = e || window.event;
	if ( e && e.stopPropagation ){
		e.stopPropagation();
	}else{
		e.cancelBubble = true;
	}
}