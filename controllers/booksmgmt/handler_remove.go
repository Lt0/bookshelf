package booksmgmt

import (
	"fmt"
	"os"
	"path"

	"github.com/Lt0/bookshelf/controllers/books"
	"github.com/astaxie/beego"
)

//remove a book or a directory
type BooksMgmtRemove struct {
	Controller *beego.Controller

	path string
	err  error
}

func (p *BooksMgmtRemove) Do() interface{} {
	p.getPath()
	p.remove()
	return p.err
}

func (p *BooksMgmtRemove) getPath() {
	p.path = p.Controller.GetString("path")
	p.path = path.Join(books.BooksConf.BookRoot, p.path)
	fmt.Println("p.path:", p.path)
}

func (p *BooksMgmtRemove) remove() {
	if _, err := os.Stat(p.path); os.IsNotExist(err) {
		fmt.Println("path not found")
		return
	}

	p.err = os.RemoveAll(p.path)
	if p.err != nil {
		fmt.Println("err: ", p.err)
	}
}
