#!/bin/sh

IMG="lightimehpq/bookshelf"

show_help() {
echo "
Show help:
  docker run --rm $IMG -h

Start bookshelf:
  docker run -d --restart=always --name=bookshelf -p <host_port>:80 --env password=<admin_password> -v <host_books_dir>:/opt/bookshelf/books -it $IMG

Example:
  docker run -d --restart=always --name=bookshelf -p 8080:80 --env password=admin -v /books:/opt/bookshelf/books -it $IMG
"
}

if [ $# -gt 0 ]; then
  show_help
else
  [ -n "$password" ] && sed -i "s/defaultPasswd = .*$/defaultPasswd = $password/g" conf/app.conf
  ./bookshelf
fi
