package reader

import (
	"fmt"
	"os"
	"regexp"
	"path"
	"github.com/astaxie/beego"
)

type TxtBookMarksSaver struct {
	Controller *beego.Controller

	bookmarkDir		string
	path			string
	errMsg			string //error message to return
}

func (p *TxtBookMarksSaver) Do() interface{} {
	p.getParams()
	p.save()
	return p.errMsg
}

func (p *TxtBookMarksSaver) getParams() {
	p.bookmarkDir = "static/cache/txt/bookmarks/"
	file := p.Controller.GetString("file")
	if file == "" {
		fmt.Println("no file of bookmarks to save")
		p.errMsg = "no file indicated"
		return
	}
	p.path = path.Join(p.bookmarkDir, file)
}

func (p *TxtBookMarksSaver) save() {
	if p.errMsg != "" {
		return
	}
	
	dir := path.Dir(p.path);
	err := os.MkdirAll(dir, 0666)
	if err != nil {
		fmt.Println("MkdirAll: ", err)
		p.errMsg = fmt.Sprintf("%s", err)
		return;
	}

	bookmarks := p.Controller.Ctx.Input.RequestBody
	re := regexp.MustCompile(`\\\"`)
	bookmarksStr := re.ReplaceAllString(string(bookmarks), `"`)

	os.Remove(p.path)
	f, err := os.OpenFile(p.path, os.O_RDWR | os.O_CREATE, 0644)
	if err != nil {
		fmt.Println("open file err:", err)
		p.errMsg = fmt.Sprintf("%s", err)
		return
	}

	fmt.Println("bookmarksStr:", bookmarksStr)
	_, err = f.WriteString(bookmarksStr)
	if err != nil {
		fmt.Println("write file err:", err)
		p.errMsg = fmt.Sprintf("%s", err)
	}

	if err = f.Close(); err != nil {
		fmt.Println("close file err:", err)
	}
}
