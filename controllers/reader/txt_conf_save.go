package reader

import (
	"fmt"
	"os"
	"regexp"
	"github.com/astaxie/beego"
)

type TxtConfSaver struct {
	Controller *beego.Controller

	errMsg   string //error message to return
}

func (p *TxtConfSaver) Do() interface{} {
	p.save()
	return p.errMsg
}

func (p *TxtConfSaver) save() {
	conf := p.Controller.Ctx.Input.RequestBody
	re := regexp.MustCompile(`\\\"`)
	confStr := re.ReplaceAllString(string(conf), `"`)

	path := "static/cache/conf/user.conf"
	os.Remove(path)
	f, err := os.OpenFile(path, os.O_RDWR | os.O_CREATE, 0644)
	if err != nil {
		fmt.Println("open file err:", err)
		p.errMsg = fmt.Sprintf("%s", err)
		return
	}

	fmt.Println("confStr:", confStr)
	_, err = f.WriteString(confStr)
	if err != nil {
		fmt.Println("write file err:", err)
		p.errMsg = fmt.Sprintf("%s", err)
	}

	if err = f.Close(); err != nil {
		fmt.Println("close file err:", err)
	}
}
