$(document).ready(function(){
	initScrollbar();

	fileUrl = getFileUrl();
	initTitle(fileUrl);
	render(fileUrl);
});

function initScrollbar(){
	var Scrollbar = window.Scrollbar;
	Scrollbar.init(document.querySelector("#toc"));
	//Scrollbar.init(document.querySelector("body"));
}

function render(fileUrl){
	var testEditormdView;

	//var fileUrl = "editor.md/test.md";
	//var fileUrl = "/books/markdown.md";
	$.get(fileUrl, function(markdown) {
		$("#loading").fadeOut();          
		testEditormdView = editormd.markdownToHTML("test-editormd-view", {
			markdown        : markdown ,//+ "\r\n" + $("#append-test").text(),
			htmlDecode      : true,       // 开启 HTML 标签解析，为了安全性，默认不开启
			//htmlDecode      : "style,script,iframe",  // you can filter tags decode
			//toc             : false,
			tocm            : true,    // Using [TOCM]
			tocContainer    : "#custom-toc-container", // 自定义 ToC 容器层
			gfm             : true,
			//tocDropdown     : true,
			// markdownSourceCode : true, // 是否保留 Markdown 源码，即是否删除保存源码的 Textarea 标签
			emoji           : true,
			taskList        : true,
			tex             : true,  // 默认不解析
			flowChart       : true,  // 默认不解析
			sequenceDiagram : true,  // 默认不解析
		});
	});
}

function initTitle(fileUrl){
	var t = fileUrl.substr(fileUrl.lastIndexOf("/")+1);
	$("title").html(t);
}

function toggleToc(){
	console.log("toggleToc");
	$("#toc").slideToggle("fast");
}

function getFileUrl(){
	console.log("getFileUrl");
	var u = window.location.href ;
	var args = u.replace(/^.*\/\?/, "") + u.replace(/\#.*$/, "");
	var pattern = "file=";
	var path = args.substr(args.lastIndexOf(pattern) + pattern.length);

	console.log("getFileUrl: path: " + path);
	return path;
}