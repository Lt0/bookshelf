package books

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/astaxie/beego"
)

type GetBooksDirCatalog struct {
	Controller *beego.Controller

	path string //relative path of book's root

	bookList []zTreeSimpleData

	walkingSymLink bool
	symRealPath    string
	symLinkPath    string
	err            error
}

func (p *GetBooksDirCatalog) Do() interface{} {
	p.getPath()
	p.getFiles()
	p.addBookRoot()
	return p.bookList
}

func (p *GetBooksDirCatalog) getPath() {
	var f map[string]interface{}
	err := json.Unmarshal(p.Controller.Ctx.Input.RequestBody, &f)
	if err != nil {
		fmt.Println("unmarshal path from json err: ", err)
	}

	if f["path"] != nil {
		p.path = filepath.Join(BooksConf.BookRoot, f["path"].(string))
	} else {
		p.path = BooksConf.BookRoot
	}

	fmt.Println("Getting catalog in:", p.path)
}

func (p *GetBooksDirCatalog) getFiles() {
	files, err := ioutil.ReadDir(p.path)
	if err != nil {
		fmt.Println("read dir:", err)
		return
	}

	for _, f := range files {
		path := filepath.Join(p.path, f.Name())
		ztreeAddItem(&p.bookList, path, f)
	}

	fmt.Println(p.bookList)
}

func (p *GetBooksDirCatalog) addBookRoot() {
	//Only add Book Root to bookList when p.path is /
	if p.path != BooksConf.BookRoot {
		return
	}

	f, _ := os.Stat(BooksConf.BookRoot)
	ztreeAddItem(&p.bookList, BooksConf.BookRoot, f)
}
