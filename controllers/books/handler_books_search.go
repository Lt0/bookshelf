package books

import (
	"fmt"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/astaxie/beego"
)

type SearchBook struct {
	Controller *beego.Controller

	pattern  string
	retLines []string //lines returned from find command
	outLines []string //output lines to frontend
}

func (p *SearchBook) Do() interface{} {
	p.getPattern()
	p.search()
	p.fmtRetLines()
	return p.outLines
}

func (p *SearchBook) getPattern() {
	p.pattern = p.Controller.GetString("pattern")
	fmt.Println("pattern:", p.pattern)
}

func (p *SearchBook) search() {
	args := fmt.Sprintf("/usr/bin/find -L %s -iname \"*%s*\"", BooksConf.BookRoot, p.pattern)
	out, err := exec.Command("sh", "-c", args).Output()
	if err != nil {
		fmt.Println("exec failed:", err)
	}

	p.retLines = strings.Split(string(out), "\n")
	//fmt.Println(p.retLines)
}

func (p *SearchBook) fmtRetLines() {
	for _, l := range p.retLines {
		if len(l) == 0 {
			continue
		}
		//fmt.Println("checking line:", l)
		if IsBook(l) {
			relPath, _ := filepath.Rel(BooksConf.BookRoot, l)
			p.outLines = append(p.outLines, relPath)
			//fmt.Println("added:", relPath)
		}
	}
}
