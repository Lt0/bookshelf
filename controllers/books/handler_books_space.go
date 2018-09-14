package books

import (
	"fmt"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/astaxie/beego"
)

type BooksSpace struct {
	Controller *beego.Controller

	path   string
	retMsg string
}

func (p *BooksSpace) Do() interface{} {
	p.getParam()
	p.getSpace()
	return p.retMsg
}

func (p *BooksSpace) getParam() {
	p.path = p.Controller.GetString("path")
	p.path = filepath.Join(BooksConf.BookRoot, p.path) + "/"
	fmt.Println("path:", p.path)
}

func (p *BooksSpace) getSpace() {
	args := fmt.Sprintf("/usr/bin/du -sh \"%s\"", p.path)
	fmt.Println("cmd:", args)
	out, err := exec.Command("sh", "-c", args).Output()
	if err != nil {
		fmt.Println("exec failed:", err)
		p.retMsg = fmt.Sprintf("err: %s", err)
		return
	}

	p.retMsg = strings.Split(string(out), "\t")[0]
	fmt.Println("space: ", p.retMsg)
}
