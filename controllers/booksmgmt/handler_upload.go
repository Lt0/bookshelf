package booksmgmt

import (
	"fmt"
	"os"
	//"log"
	"path"

	"github.com/Lt0/bookshelf/controllers/books"
	"github.com/astaxie/beego"
)

//remove a book or a directory
type BooksMgmtUpload struct {
	Controller *beego.Controller

	path     string
	override string // override target file if it's exist? true/false, default is false
	err      error
	errMsg   string //error message to return
}

func (p *BooksMgmtUpload) Do() interface{} {
	p.getPath()
	p.save()
	return p.errMsg
}

func (p *BooksMgmtUpload) getPath() {
	p.path = p.Controller.GetString("path")
	p.path = path.Join(books.BooksConf.BookRoot, p.path)
	fmt.Println("p.path:", p.path)
}

// name of form's input
func (p *BooksMgmtUpload) save() {
	f, h, err := p.Controller.GetFile("uploadFile")
	if err != nil {
		//log.Fatal("getfile err", err)
		fmt.Println("getfile err", err)
		p.errMsg = fmt.Sprintln("getfile err", err)
		return
	}
	defer f.Close()
	fmt.Println("filename:", h.Filename)
	filePath := path.Join(p.path, h.Filename)

	_, p.err = os.Stat(filePath)
	if !os.IsNotExist(p.err) {
		fmt.Println(filePath, "is exist")
		p.override = p.Controller.GetString("override")
		fmt.Println("override: ", p.override)
		if p.override != "true" {
			fmt.Println("Not save file")
			p.errMsg = fmt.Sprintf("%s", "target exist")
			return
		}
	}

	dir := path.Dir(filePath)
	if _, err = os.Stat(dir); os.IsNotExist(err) {
		os.MkdirAll(dir, 0666)
	}
	p.Controller.SaveToFile("uploadFile", filePath)
}
