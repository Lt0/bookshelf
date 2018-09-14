package books

import (
	"fmt"
	"io/ioutil"
	"os"
	"path"
	"path/filepath"

	"github.com/astaxie/beego"
)

type GetBooksNum struct {
	Controller *beego.Controller

	path string
	num  int

	//walkingSym string
}

func (p *GetBooksNum) Do() interface{} {
	p.getParam()
	p.getDirBooksNum(p.path)
	return p.num
}

func (p *GetBooksNum) getParam() {
	p.path = p.Controller.GetString("path")
	p.path = path.Join(BooksConf.BookRoot, p.path)
	fmt.Println("get books num in:", "in", p.path)
}

func (p *GetBooksNum) getDirBooksNum(path string) {
	files, err := ioutil.ReadDir(path)
	if err != nil {
		fmt.Println("read dir:", err)
		return
	}

	for _, f := range files {
		item := filepath.Join(path, f.Name())
		p.processPath(item)
	}
}

func (p *GetBooksNum) processPath(path string) error {
	f, err := os.Stat(path)
	if f == nil {
		fmt.Println("processPath: stat failed", err)
		return err
	}

	_, err = os.Readlink(path)
	if err == nil {
		// is symlink
		if IsDeadLoopSymlink(path) {
			fmt.Println("processPath: found dead loop symlink:" + path)
			return nil
		}
	}
	//regular file was treated as book, if a path is not a book, it must be a directory but not linkBook/webBook
	if IsBook(path) {
		p.num++
	} else {
		p.getDirBooksNum(path)
	}
	return nil
}
