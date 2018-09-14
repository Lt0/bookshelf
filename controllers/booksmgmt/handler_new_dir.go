package booksmgmt

import (
	"fmt"
	"os"
	"path"

	"github.com/Lt0/bookshelf/controllers/books"
	"github.com/astaxie/beego"
)

//create a new directory
type BooksMgmtNewDir struct {
	Controller *beego.Controller

	path string
	err  error
}

func (p *BooksMgmtNewDir) Do() interface{} {
	p.path = p.Controller.GetString("path")
	p.path = path.Join(books.BooksConf.BookRoot, p.path)
	fmt.Println("p.path:", p.path)
	p.err = os.MkdirAll(p.path, 0666)
	fmt.Println("make new dir err: ", p.err)
	return p.err
}
