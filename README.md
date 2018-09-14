# Bookshelf

Bookshelf 是一个面向个人的 C/S 端书架应用，可以将书籍保存在服务端，然后通过浏览器查阅这些书籍。

后端采用 Go 语言 + beego 框架实现，前端使用 jquery/jquery ui/bootstrap 等框架实现。

## 演示
https://athena-bookshelf.com

http://athena-bookshelf.com


## 支持的特性：
1. 格式支持：gitbook/pdf/epub/markdown/txt/html/网页链接
2. 上传：后台上传，批量上传，失败重传，停止上传，拖拽上传（拖到当前目录上传，拖到当前子目录上传）
3. 下载：支持下载 pdf/epub/markdown/txt/html 格式文件到本地
4. 远程下载：支持通过 url 远程下载 gitbook，pdf，txt，epub 书籍到服务端
5. 管理：支持 复制/剪切/粘贴/删除/重命名 等操作（包括快捷键）
6. 用户管理：支持单用户，只有登陆后的用户才允许管理书籍
7. 浏览模式：支持两种浏览模式：图标模式/详情模式
8. 分享：支持通过二维码分享，或直接通过二维码打开/下载书籍
9. 搜索：支持搜索功能，允许搜索所有直接支持的书籍格式

## 格式支持说明
上面提到的支持的格式，都是支持直接使用内置的阅读器在浏览器打开阅读，各个格式的阅读器如下：
1. txt: txt-web，项目地址: https://github.com/Lt0/txt-web
2. pdf: pdf.js，项目地址：https://github.com/mozilla/pdf.js/
3. epub: epub.js，项目地址：https://github.com/futurepress/epub.js/
4. markdown: editor.md，项目地址：https://pandao.github.io/editor.md/
5. gitbook: 使用 gitbook 自带的阅读器
6. html: 直接在浏览器打开


## 预览
<p align="center">
  主界面
  <img src="https://github.com/Lt0/bookshelf/blob/master/docs/main.png" alt="主界面" title="主界面" />
  
  <br>
  <br>
  统计信息
  <img src="https://github.com/Lt0/bookshelf/blob/master/docs/stat.png" alt="统计信息" title="统计信息" />
  
  <br>
  <br>
  拖拽上传
  <img src="https://github.com/Lt0/bookshelf/blob/master/docs/upload-drag.png" alt="拖拽上传" title="拖拽上传" />
  
  <br>
  <br>
  上传编辑界面
  <img src="https://github.com/Lt0/bookshelf/blob/master/docs/upload-confirm.png" alt="上传编辑界面" title="上传编辑界面" />
  
  <br>
  <br>
  上传任务列表
  <img src="https://github.com/Lt0/bookshelf/blob/master/docs/upload-task.png" alt="上传任务列表" title="上传任务列表" />
  
  <br>
  <br>
  二维码分享/打开
  <img src="https://github.com/Lt0/bookshelf/blob/master/docs/qrcode.png" alt="二维码分享/打开" title="二维码分享/打开" />
  
  <br>
  <br>
  txt 阅读器-章节列表
  <img src="https://github.com/Lt0/bookshelf/blob/master/docs/reader-txt-1.png" alt="txt 阅读器-章节列表" title="txt 阅读器-章节列表" />
  
  <br>
  <br>
  txt 阅读器-主题定制
  <img src="https://github.com/Lt0/bookshelf/blob/master/docs/reader-txt-2.png" alt="txt 阅读器-主题定制" title="txt 阅读器-主题定制" />
  
  <br>
  <br>
  txt 阅读器-书签
  <img src="https://github.com/Lt0/bookshelf/blob/master/docs/reader-txt-3.png" alt="txt 阅读器-书签" title="txt 阅读器-书签" />
  
  <br>
  <br>
  epub 阅读器
  <img src="https://github.com/Lt0/bookshelf/blob/master/docs/reader-epub.png" alt="epub 阅读器" title="epub 阅读器" />
  
  <br>
  <br>
  gitbook 阅读器
  <img src="https://github.com/Lt0/bookshelf/blob/master/docs/reader-gitbook.png" alt="gitbook 阅读器" title="gitbook 阅读器" />
  
  <br>
  <br>
  markdown 阅读器
  <img src="https://github.com/Lt0/bookshelf/blob/master/docs/reader-markdown.png" alt="markdown 阅读器" title="markdown 阅读器" />
  
  <br>
  <br>
  pdf 阅读器
  <img src="https://github.com/Lt0/bookshelf/blob/master/docs/reader-pdf.png" alt="pdf 阅读器" title="pdf 阅读器" />
</p>
