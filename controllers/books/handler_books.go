package books

import (
	"fmt"
	"os"
	"path/filepath"
	"time"
)

type BooksConfig struct {
	BookRoot      string
	CacheRoot     string
	CacheBookRoot string
}

var BooksConf BooksConfig

type zTreeSimpleData struct {
	ID       string   `json:"id"`
	PID      string   `json:"pId"`
	Name     string   `json:"name"`
	IsParent bool     `json:"isParent"`
	Open     bool     `json:"open"`
	IconSkin string   `json:"iconSkin"`
	BookInfo bookInfo `json:"bookInfo"`
}

type bookInfo struct {
	IsBook   bool   //indicate whether it's a book, only directory but not webBook should set it as false
	BType    string //book type: .txt, .pdf, .md, .webBook, .linkBook
	BSize    int64
	BModTime time.Time
	BEntry   string //book entry for open the book
}

func isLinkBook(path string) string {
	index := filepath.Join(path, "index.html")
	mark := filepath.Join(path, ".linkBook")
	if _, err := os.Stat(index); !os.IsNotExist(err) {
		if _, err := os.Stat(mark); !os.IsNotExist(err) {
			return index
		}
	}

	return ""
}

//return entry path if the path is a web book(e.g: gitbook)
func isWebBook(path string) string {
	webBookPattern := []string{"index.html", "introduction/index.html", "content/index.html", "introduction.html", "chapter_Appendix_A.html", "chapter_Appendix_B.html", "chapter1.html", "gitbook/gitbook.js", "gitbook/app.js", "gitbook/theme.js", "gitbook/style.css", "gitbook/images/favicon.ico"}
	for _, v := range webBookPattern {
		entryPath := filepath.Join(path, v)
		if _, err := os.Stat(entryPath); !os.IsNotExist(err) {
			//fmt.Println("found", entryPath, ", is a web book")
			if v == "gitbook/gitbook.js" || v == "gitbook/images/favicon.ico" {
				return path
			}
			return entryPath
		}
	}

	return ""
}

func IsBook(path string) bool {
	fi, err := os.Stat(path)
	if err != nil {
		fmt.Println("stat failed:", err)
		return false
	}

	if IsWebBookSubItem(path) {
		return false
	}

	if fi.IsDir() {
		if isLinkBook(path) != "" {
			return true
		}
		if isWebBook(path) == "" {
			return false
		}
	}

	return true
}

func IsWebBookSubItem(path string) bool {
	d := path
	if path == "." {
		return false
	}
	for {
		d = filepath.Dir(d)
		if isWebBook(d) != "" {
			return true
		}
		if d == "." || d == BooksConf.BookRoot {
			return false
		}
	}
}

func ztreeAddItem(zList *[]zTreeSimpleData, path string, f os.FileInfo) {
	if mode := f.Mode(); mode&os.ModeSymlink != 0 {
		ztreeAddSymLink(zList, path, f)
		return
	}

	if f.IsDir() {
		zTreeAddDir(zList, path, f)
		return
	}

	zTreeAddCommonBook(zList, path, f)
}

//destination of a symLink may be a directory or regular file
func ztreeAddSymLink(zList *[]zTreeSimpleData, path string, f os.FileInfo) {
	rpath, err := os.Readlink(path)
	if err != nil {
		fmt.Println("ztreeAddSymLink: Readlink failed:", err)
		return
	}

	var rf os.FileInfo
	rf, err = os.Stat(rpath)
	if err != nil {
		fmt.Println("ztreeAddSymLink: stat failed:", err)
		return
	}

	if rf.IsDir() {
		zTreeAddDir(zList, path, f)
		return
	}

	zTreeAddCommonBook(zList, path, f)
}

//A directory may be a linkBook or webBook
func zTreeAddDir(zList *[]zTreeSimpleData, path string, f os.FileInfo) {
	entryPath := isLinkBook(path)
	if entryPath != "" {
		zTreeAddLinkBook(zList, path, f, entryPath)
		return
	}

	entryPath = isWebBook(path)
	if entryPath != "" {
		zTreeAddWebBook(zList, path, f, entryPath)
		return
	}

	zTreeAddParent(zList, path, f)
}

//Parent means item is a directory but not a webBook
func zTreeAddParent(zList *[]zTreeSimpleData, path string, f os.FileInfo) {
	var ztsd zTreeSimpleData
	var err error

	ztsd.IsParent = true
	ztsd.Open = false
	ztsd.Name = f.Name()

	ztsd.ID, err = filepath.Rel(BooksConf.BookRoot, path)
	if err != nil {
		fmt.Println("get ztsd.ID:", err)
	}

	ztsd.PID, err = filepath.Rel(BooksConf.BookRoot, filepath.Dir(path))
	if err != nil {
		fmt.Println("get ztsd.PID:", err)
	}

	ztsd.BookInfo.IsBook = false

	*zList = append(*zList, ztsd)
}

func zTreeAddLinkBook(zList *[]zTreeSimpleData, path string, f os.FileInfo, entryPath string) {
	var ztsd zTreeSimpleData
	var err error

	ztsd.IsParent = false
	ztsd.Name = f.Name()

	ztsd.ID, err = filepath.Rel(BooksConf.BookRoot, path)
	if err != nil {
		fmt.Println("get ztsd.ID:", err)
	}

	ztsd.PID, err = filepath.Rel(BooksConf.BookRoot, filepath.Dir(path))
	if err != nil {
		fmt.Println("get ztsd.PID:", err)
	}

	ztsd.IconSkin = "link"

	ztsd.BookInfo.IsBook = true
	ztsd.BookInfo.BType = ".linkBook"
	ztsd.BookInfo.BEntry = entryPath

	*zList = append(*zList, ztsd)
}

func zTreeAddWebBook(zList *[]zTreeSimpleData, path string, f os.FileInfo, entryPath string) {
	var ztsd zTreeSimpleData
	var err error

	ztsd.IsParent = false
	ztsd.Name = f.Name()

	ztsd.ID, err = filepath.Rel(BooksConf.BookRoot, path)
	if err != nil {
		fmt.Println("get ztsd.ID:", err)
	}

	ztsd.PID, err = filepath.Rel(BooksConf.BookRoot, filepath.Dir(path))
	if err != nil {
		fmt.Println("get ztsd.PID:", err)
	}

	ztsd.IconSkin = "web"

	ztsd.BookInfo.IsBook = true
	ztsd.BookInfo.BType = ".webBook"
	ztsd.BookInfo.BEntry = entryPath

	*zList = append(*zList, ztsd)
}

func zTreeAddCommonBook(zList *[]zTreeSimpleData, path string, f os.FileInfo) {
	var ext2icon map[string]string
	//ext2icon = map[string]string{".txt": "txt"}
	ext2icon = map[string]string{".txt": "txt", ".pdf": "pdf", ".webBook": "web", ".epub": "epub", ".linkBook": "link", ".md": "md", ".htm": "html", ".html": "html", ".xhtml": "html"}
	var ztsd zTreeSimpleData
	var err error

	ztsd.IsParent = false
	ztsd.Name = f.Name()

	ztsd.ID, err = filepath.Rel(BooksConf.BookRoot, path)
	if err != nil {
		fmt.Println("get ztsd.ID:", err)
	}

	ztsd.PID, err = filepath.Rel(BooksConf.BookRoot, filepath.Dir(path))
	if err != nil {
		fmt.Println("get ztsd.PID:", err)
	}

	ztsd.BookInfo.IsBook = true
	ztsd.BookInfo.BType = filepath.Ext(path)
	ztsd.BookInfo.BEntry = path
	ztsd.BookInfo.BSize = f.Size()
	ztsd.BookInfo.BModTime = f.ModTime()

	ztsd.IconSkin = ext2icon[ztsd.BookInfo.BType]

	*zList = append(*zList, ztsd)
}

func IsDeadLoopSymlink(path string) bool {
	rpath, err := os.Readlink(path)
	if err != nil {
		fmt.Println("Not SymLink: ", path)
		return false
	}

	var root string
	root, err = os.Readlink(BooksConf.BookRoot)
	if err != nil {
		fmt.Println("root is not SymLink: ", root)
		root = filepath.Clean(BooksConf.BookRoot)
	}

	fmt.Println("checking root:", root)
	fmt.Println("checking rpath:", rpath)
	for rpath != "/" && rpath != "." {
		fmt.Println("checking rpath:", rpath)
		if root == rpath {
			return true
		}

		rpath = filepath.Dir(rpath)
	}

	return false
}
