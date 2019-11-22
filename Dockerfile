FROM alpine:3.10 as build

RUN apk add go musl-dev
ARG build_dir="/root/go/src/github.com/Lt0/bookshelf"
RUN mkdir -p $build_dir
COPY controllers $build_dir/controllers 
COPY routers $build_dir/routers
COPY vendor $build_dir/vendor
COPY main.go $build_dir/
WORKDIR $build_dir
RUN go build

FROM alpine:3.10 as install
ARG build_dir="/root/go/src/github.com/Lt0/bookshelf"
ARG install_dir="/opt/bookshelf"
RUN mkdir /opt/bookshelf
RUN mkdir -p $install_dir/cache/conf
RUN mkdir $install_dir/books
RUN mkdir $install_dir/conf
COPY README.md $install_dir/books
COPY conf/prod.conf $install_dir/conf/app.conf
COPY static $install_dir/static
COPY views $install_dir/views
COPY --from=build $build_dir/bookshelf /opt/bookshelf/bookshelf

COPY entrypoint.sh $install_dir/
RUN chmod a+x /$install_dir/entrypoint.sh

FROM lightimehpq/alpine-wget
ARG install_dir="/opt/bookshelf"
COPY --from=install /opt/bookshelf /opt/bookshelf
WORKDIR $install_dir
ENTRYPOINT ["/opt/bookshelf/entrypoint.sh"]
