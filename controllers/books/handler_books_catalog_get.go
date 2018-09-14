package books

import (
	"fmt"
	"os"
	"strings"

	"path/filepath"

	"github.com/astaxie/beego"
)

type GetBooksCatalog struct {
	Controller *beego.Controller

	bookRoot string

	bookList []zTreeSimpleData

	walkingSymLink bool
	symRealPath    string
	symLinkPath    string
	err            error
}

func (p *GetBooksCatalog) Do() interface{} {
	p.bookRoot = BooksConf.BookRoot
	p.getDirFileList()
	p.expandBooksRoot()
	return p.bookList
}

func (p *GetBooksCatalog) getDirFileList() {
	err := filepath.Walk(p.bookRoot, p.getDirFileListWalk)
	if err != nil {
		fmt.Println("walk books err")
	}
}

func (p *GetBooksCatalog) getDirFileListWalk(path string, f os.FileInfo, err error) error {
	var ztsd zTreeSimpleData
	if f == nil {
		return err
	} else if f.IsDir() {
		ztsd.IsParent = true

		//check if the dir is a web book
		entryPath := isWebBook(path)
		if entryPath != "" {
			ztsd.BookInfo.BType = ".webBook"
			ztsd.BookInfo.BEntry = entryPath
		}
	} else {
		ztsd.IsParent = false
		ztsd.BookInfo.BType = filepath.Ext(path)
		ztsd.BookInfo.BEntry = path
	}

	if p.walkingSymLink {
		if path == p.symRealPath {
			return nil
		}
		path = strings.Replace(path, p.symRealPath, p.symLinkPath+"/", 1)
		ztsd.BookInfo.BEntry = strings.Replace(ztsd.BookInfo.BEntry, p.symRealPath, p.symLinkPath+"/", 1)
	}

	ztsd.ID, err = filepath.Rel(p.bookRoot, path)
	if err != nil {
		fmt.Println("get ztsd.ID:", err)
	}

	ztsd.Name = filepath.Base(path)
	ztsd.PID, err = filepath.Rel(p.bookRoot, filepath.Dir(path))
	if err != nil {
		fmt.Println("get ztsd.PID:", err)
	}

	p.bookList = append(p.bookList, ztsd)

	//process dir symbol link
	if mode := f.Mode(); mode&os.ModeSymlink != 0 {
		rpath, _ := os.Readlink(path)
		if rf, _ := os.Stat(rpath); rf.IsDir() {
			curZtsd := &p.bookList[len(p.bookList)-1]
			curZtsd.IsParent = true

			entryPath := isWebBook(rpath)
			if entryPath != "" {
				curZtsd.BookInfo.BType = ".webBook"
				curZtsd.BookInfo.BEntry = entryPath
			}

			p.walkingSymLink = true
			p.symLinkPath = path
			p.symRealPath = rpath
			err := filepath.Walk(rpath, p.getDirFileListWalk)
			if err != nil {
				fmt.Println("walk", rpath, "err:", err)
			}
			p.walkingSymLink = false
			p.symLinkPath = ""
			p.symRealPath = ""
			return nil
		}
	}
	return nil
}

//set books Root to expand in zTree
func (p *GetBooksCatalog) expandBooksRoot() {
	p.bookList[0].Open = true
}
