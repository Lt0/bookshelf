package booksmgmt

import (
	"fmt"
	"log"
	//"net/url"
	"os"
	"os/exec"
	"path"

	"github.com/Lt0/bookshelf/controllers/books"
	"github.com/astaxie/beego"
)

//check a full path whether exist
type BooksMgmtAdd struct {
	Controller *beego.Controller

	path   string
	name   string // book name
	url    string //book url to download or link
	BType  string //new book type, normal/link/webBook
	err    error
	retMsg string //return message, return true if file exist, return false if not.
}

func (p *BooksMgmtAdd) Do() interface{} {
	p.getParam()
	p.checkPath()
	p.add()
	return p.retMsg
}

func (p *BooksMgmtAdd) getParam() {
	var err error
	p.path = p.Controller.GetString("path")
	//p.path, err = url.QueryUnescape(p.path)
	if err != nil {
		fmt.Println("Ivalid path")
		p.retMsg = "Invalid path"
		return
	}
	p.path = path.Join(books.BooksConf.BookRoot, p.path)
	fmt.Println("p.path:", p.path)

	p.url = p.Controller.GetString("BUrl")
	//p.url, err = url.QueryUnescape(p.url)
	if err != nil {
		fmt.Println("Ivalid url")
		p.retMsg = "Invalid url"
		return
	}
	fmt.Println("p.url:", p.url)

	p.name = p.Controller.GetString("BName")
	//p.name, err = url.QueryUnescape(p.name)
	if err != nil {
		fmt.Println("Ivalid name")
		p.retMsg = "Invalid name"
		return
	}
	fmt.Println("p.name:", p.name)

	p.BType = p.Controller.GetString("BType")
	fmt.Println("p.BType:", p.BType)
	if p.BType == "" {
		p.BType = "normal"
	}
}

func (p *BooksMgmtAdd) checkPath() {
	_, p.err = os.Stat(p.path)
	if os.IsNotExist(p.err) {
		fmt.Println("NOT exist:", p.path)
		p.retMsg = "path not found"
		p.path = ""
		return
	}
}

func (p *BooksMgmtAdd) add() {
	p.err = nil
	if p.path == "" || p.url == "" || p.BType == "" {
		fmt.Println("param not enaugh")
		return
	}

	switch p.BType {
	case "normal":
		fmt.Println("add normal book")
		p.err = downloadNormalBook(p.path, p.name, p.url)
	case "link":
		fmt.Println("add link book")
		p.err = createLinkBook(p.path, p.name, p.url)
	case "webBook":
		fmt.Println("add webBook book")
		p.err = downloadWebBook(p.path, p.name, p.url)
	default:
		fmt.Println("unknow book type to add")
		p.retMsg = "unknow type"
		return
	}

	if p.err != nil {
		p.retMsg = fmt.Sprintln(p.err)
	}
}

func downloadNormalBook(path, name, url string) error {
	var args string
	if name == "" {
		args = fmt.Sprintf("/usr/bin/wget --restrict-file-name=nocontrol -P \"%s\" \"%s\"", path, url)
	} else {
		savePath := path + "/" + name
		args = fmt.Sprintf("/usr/bin/wget --restrict-file-name=nocontrol -O \"%s\" \"%s\"", savePath, url)
	}

	fmt.Println("args", args)
	_, err := exec.Command("sh", "-c", args).Output()
	if err != nil {
		fmt.Println("exec failed:", err)
		return err
	}
	return nil
}

func downloadWebBook(path, name, url string) error {
	fmt.Println("downloadWebBook")
	var args string
	if name == "" {
		fmt.Println("downloadWebBook: no name to download in")
		return fmt.Errorf("%s", "require name")
	} else {
		savePath := path + "/" + name
		_, err := os.Stat(savePath)
		if !os.IsNotExist(err) {
			fmt.Println("downloadWebBook: already exist book:", savePath)
			return fmt.Errorf("%s", "book already exist")
		}
		args = fmt.Sprintf("/usr/bin/wget --mirror --convert-links --adjust-extension --page-requisites --no-parent --no-host-directories --no-directories -P \"%s\" \"%s\"", savePath, url)
	}

	fmt.Println("args", args)
	_, err := exec.Command("sh", "-c", args).Output()
	if err != nil {
		fmt.Println("exec failed:", err)
		return err
	}
	return nil
}

func createLinkBook(path, name, url string) error {
	fmt.Println("createLinkBook")
	if name == "" {
		fmt.Println("createLinkBook: no name to add")
		return fmt.Errorf("%s", "require name")
	}

	savePath := path + "/" + name
	_, err := os.Stat(savePath)
	if !os.IsNotExist(err) {
		fmt.Println("createLinkBook: already exist book:", savePath)
		return fmt.Errorf("%s", "book already exist")
	}

	err = os.MkdirAll(savePath, 0666)
	if err != nil {
		fmt.Println("createLinkBook: create new book failed: ", savePath)
		return err
	}

	file := savePath + "/" + "index.html"
	f, err := os.OpenFile(file, os.O_RDWR|os.O_CREATE, 0755)
	if err != nil {
		log.Println(err)
		return err
	}

	content := "<head>\n"
	content += fmt.Sprintf("  <meta http-equiv=\"refresh\" content=\"0;URL=%s\" />\n", url)
	content += "</head>"
	_, err = f.WriteString(content)
	if err != nil {
		log.Println(err)
		f.Close()
		return err
	}

	if err := f.Close(); err != nil {
		log.Println(err)
	}

	file = savePath + "/" + ".linkBook"
	f, err = os.OpenFile(file, os.O_RDWR|os.O_CREATE, 0755)
	if err != nil {
		log.Println(err)
		return err
	}
	if err = f.Close(); err != nil {
		log.Println(err)
	}

	return nil
}
