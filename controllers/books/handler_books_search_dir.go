package books

import (
	"fmt"
	"os/exec"
	"path"
	"path/filepath"
	"strings"

	"github.com/astaxie/beego"
)

//search book in a specified directory
type SearchBookDir struct {
	Controller *beego.Controller

	path     string   //path to search
	pattern  string   //search pattern
	retLines []string //lines returned from find command
	outLines []string //output lines to frontend
}

func (p *SearchBookDir) Do() interface{} {
	p.getParam()
	p.search()
	p.fmtRetLines()
	return p.outLines
}

func (p *SearchBookDir) getParam() {
	p.pattern = p.Controller.GetString("pattern")

	p.path = p.Controller.GetString("path")
	p.path = path.Join(BooksConf.BookRoot, p.path)
	fmt.Println("search", p.pattern, "in", p.path)
}

func (p *SearchBookDir) search() {
	args := fmt.Sprintf("/usr/bin/find -L %s -iname \"*%s*\"", p.path, p.pattern)
	out, err := exec.Command("sh", "-c", args).Output()
	if err != nil {
		fmt.Println("exec failed:", err)
	}

	p.retLines = strings.Split(string(out), "\n")
	//fmt.Println(p.retLines)
}

func (p *SearchBookDir) fmtRetLines() {
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
