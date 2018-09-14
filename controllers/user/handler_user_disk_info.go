package user

import (
	"fmt"
	"os/exec"
	//"strconv"
	"strings"

	"github.com/astaxie/beego"
)

type DefaultUserDiskInfo struct {
	Controller *beego.Controller

	info DiskInfo
}

type DiskInfo struct {
	Size       string
	Used       string
	Avail      string
	UsePerCent string
	Err        string
}

func (p *DefaultUserDiskInfo) Do() interface{} {
	args := fmt.Sprintf(`/bin/df -h | grep " /$" | awk '{print $2 "|" $3 "|"  $4 "|" $5}'`)
	fmt.Println("cmd:", args)
	out, err := exec.Command("sh", "-c", args).Output()
	if err != nil {
		fmt.Println("exec failed:", err)
		p.info.Err = fmt.Sprintf("err: %s", err)
		return p.info
	}
	fmt.Println("out:", string(out))
	infos := strings.Split(string(out), "|")
	for i, v := range infos {
		fmt.Println(i, ":", v)
	}
	p.info.Size = infos[0]
	p.info.Used = infos[1]
	p.info.Avail = infos[2]
	p.info.UsePerCent = infos[3]

	return p.info
}
