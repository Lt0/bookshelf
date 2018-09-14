package booksmgmt

import (
	"fmt"
	"os"
	"path"

	"github.com/Lt0/bookshelf/controllers/books"
	"github.com/astaxie/beego"
)

//create a new directory
type BooksMgmtRename struct {
	Controller *beego.Controller

	oldPath string
	newPath string

	err error
}

func (p *BooksMgmtRename) Do() interface{} {
	p.getParam()
	p.rename()
	return p.err
}

func (p *BooksMgmtRename) getParam(){
	p.oldPath = p.Controller.GetString("oldPath")
	p.oldPath = path.Join(books.BooksConf.BookRoot, p.oldPath)

	p.newPath = p.Controller.GetString("newPath")
	p.newPath = path.Join(books.BooksConf.BookRoot, p.newPath)	
}

func (p *BooksMgmtRename) rename() {
	if _, err := os.Stat(p.newPath); !os.IsNotExist(err) {
		fmt.Println("err: new path is exist")
		p.err = fmt.Errorf("%s", "new path is exist")
		fmt.Println(p.err)
		return
	}

	fmt.Println("Rename from", p.oldPath, "to", p.newPath)
	p.err = os.Rename(p.oldPath, p.newPath)
	fmt.Println("Rename err: ", p.err)
}
