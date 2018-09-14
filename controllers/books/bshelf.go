package books

import (
	"fmt"
	"io/ioutil"
	"log"

	"github.com/astaxie/beego"
)

type BShelfHandle struct {
	Control *beego.Controller

	books []string
}

func (p *BShelfHandle) Do() {
	p.Control.TplName = "index.html"
	//p.getBookList()
	//p.showBookList()
}

func (p *BShelfHandle) getBookList() {
	files, err := ioutil.ReadDir("books")
	if err != nil {
		log.Fatal(err)
	}
	for _, file := range files {
		fmt.Println(file.Name())
		p.books = append(p.books, file.Name())
	}
}

func (p *BShelfHandle) showBookList() {
	p.Control.Data["books"] = p.books
}
