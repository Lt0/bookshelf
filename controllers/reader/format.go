package reader

import (
	"fmt"
	//"os/exec"
	"path/filepath"
	//"strings"

	"github.com/Lt0/bookshelf/controllers/books"
	"github.com/astaxie/beego"
)

type FormatBook struct {
	Controller *beego.Controller

	path     string
	fileType string

	err    error
	retMsg interface{}
}

func (p *FormatBook) Do() interface{} {
	p.getParam()
	p.getType()
	p.format()
	return p.retMsg
}

func (p *FormatBook) getParam() {
	path := p.Controller.GetString("path")
	p.path = filepath.Join(books.BooksConf.BookRoot, path)
	fmt.Println("p.path:", p.path)
}

func (p *FormatBook) getType() {
	p.fileType = filepath.Ext(p.path)
}

func (p *FormatBook) format() {
	switch p.fileType {
	case ".txt":
		//p.retMsg = &ReadTxtHandle{Controller: p.Controller}
		handler := &SplitTxt{Controller: p.Controller}
		p.retMsg = handler.Do()

	default:
		p.retMsg = "not support type"
	}
}
