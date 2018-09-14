package booksmgmt

import (
	//"errors"
	"fmt"
	"os"
	"os/exec"
	"path"

	"github.com/Lt0/bookshelf/controllers/books"
	"github.com/astaxie/beego"
)

//remove a book or a directory
type BooksMgmtCopy struct {
	Controller *beego.Controller

	oldPath string
	newPath string

	err    error
	retMsg string
}

func (p *BooksMgmtCopy) Do() interface{} {
	p.getParam()
	p.copy()
	return p.retMsg
}

func (p *BooksMgmtCopy) getParam() {
	p.oldPath = p.Controller.GetString("oldPath")
	p.oldPath = path.Join(books.BooksConf.BookRoot, p.oldPath)

	p.newPath = p.Controller.GetString("newPath")
	p.newPath = path.Join(books.BooksConf.BookRoot, p.newPath)

	fmt.Println("copy", p.oldPath, "to", p.newPath)
}

func (p *BooksMgmtCopy) copy() {
	if _, err := os.Stat(p.oldPath); os.IsNotExist(err) {
		fmt.Println("old path is Not exist")
		p.retMsg = "old path is Not exist"
		return
	}

	if _, err := os.Stat(p.newPath); !os.IsNotExist(err) {
		fmt.Println("file is exist")
		p.retMsg = "target is exist"
		return
	}

	args := fmt.Sprintf("/bin/cp -rf \"%s\" \"%s\"", p.oldPath, p.newPath)
	_, err := exec.Command("sh", "-c", args).Output()
	if err != nil {
		fmt.Println("exec failed:", err)
		p.retMsg = fmt.Sprintf("exec failed: %v", err)
	}
}
