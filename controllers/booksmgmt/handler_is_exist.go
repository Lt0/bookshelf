package booksmgmt

import (
	"fmt"
	"net/url"
	"os"
	"path"

	"github.com/Lt0/bookshelf/controllers/books"
	"github.com/astaxie/beego"
)

//check a full path whether exist
type BooksMgmtIsExist struct {
	Controller *beego.Controller

	path   string
	err    error
	retMsg string //return message, return true if file exist, return false if not.
}

func (p *BooksMgmtIsExist) Do() interface{} {
	p.getPath()
	p.check()
	return p.retMsg
}

func (p *BooksMgmtIsExist) getPath() {
	var err error
	p.path = p.Controller.GetString("path")
	p.path, err = url.QueryUnescape(p.path)
	if err != nil {
		fmt.Println("Ivalid path")
		p.retMsg = "Invalid path"
		return
	}
	p.path = path.Join(books.BooksConf.BookRoot, p.path)
	//fmt.Println("p.path:", p.path)
}

func (p *BooksMgmtIsExist) check() {
	if p.path == "" {
		return
	}

	_, p.err = os.Stat(p.path)
	if os.IsNotExist(p.err) {
		fmt.Println("NOT exist:", p.path)
		p.retMsg = "false"
		return
	}

	p.retMsg = "true"
	fmt.Println("Exist:", p.path)
}
