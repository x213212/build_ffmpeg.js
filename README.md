![](https://i.imgur.com/yUFRvAE.png)
![](https://i.imgur.com/7oeSCLz.png)
# Version
* emcc v1.38.38
* [ffmpeg](https://github.com/FFmpeg/FFmpeg.git) latest version


# Compile Script
now version build
```
CPPFLAGS="-D_POSIX_C_SOURCE=200112 -D_XOPEN_SOURCE=600" \
emconfigure ./configure --cc="emcc" \
--prefix=$(pwd)/../dist --enable-cross-compile --target-os=none --arch=x86_64 \
--cpu=generic --disable-ffplay --disable-ffprobe  \
--disable-asm --disable-doc --disable-devices --disable-pthreads \
--disable-w32threads  --disable-hwaccels \
--disable-parsers --disable-bsfs --disable-debug --disable-protocols \
--disable-indevs --disable-outdevs --enable-protocol=file --enable-protocol=rtmp --enable-protocol=pipe \
--enable-network --enable-protocol=tcp --enable-demuxer=rtsp --enable-decoder=h264 --enable-encoder=libx264 \
--enable-demuxer=flv 

emcc -s ASSERTIONS=1 -s VERBOSE=1 -s TOTAL_MEMORY=33554432 \
-s ALLOW_MEMORY_GROWTH=1 -s WASM=1 -O2 -v ffmpeg.bc \
-o ../ffmpeg.js --pre-js ./pre.js --post-js ./post.js

# Compile
make 
```

# Build FFmpeg to WebAssmbly
```
git clone https://github.com/juj/emsdk && cd emsdk 
./emsdk install sdk-incoming-64bit binaryen-master-64bit 
./emsdk activate sdk-incoming-64bit binaryen-master-64bit
. ./emsdk_env.sh
```

https://trac.ffmpeg.org/wiki/CompilationGuide/Centos

```bash
# 首先，从github等地方获取ffmpeg的源代码
git clone https://github.com/FFmpeg/FFmpeg
cd FFmpeg

# 开始configure
# 这里的参数参考自videoconverter.js，其中注意需要额外带上下面第一行的CPPFLAGS
# 否则不能在最新的emcripten下编译通过
# 这里通过--cc="emcc"来指定编译器为emcc，emcc会调用clang来将target设置成LLVM
CPPFLAGS="-D_POSIX_C_SOURCE=200112 -D_XOPEN_SOURCE=600" \
emconfigure ./configure --cc="emcc" \
--prefix=$(pwd)/../dist --enable-cross-compile --target-os=none --arch=x86_64 \
--cpu=generic --disable-ffplay --disable-ffprobe --disable-ffserver \
--disable-asm --disable-doc --disable-devices --disable-pthreads \
--disable-w32threads --disable-network --disable-hwaccels \
--disable-parsers --disable-bsfs --disable-debug --disable-protocols \
--disable-indevs --disable-outdevs --enable-protocol=file
```
https://blog.csdn.net/xueyushenzhou/article/details/82856860

# centos 7 gcc Upgrade 7.2
https://www.booolen.com/post/20190403_centos%E4%B8%8Bglibcxx_3.4.20%E7%9A%84%E9%97%AE%E9%A2%98/
![](https://i.imgur.com/tqEsrsg.png)

install too long...

![](https://i.imgur.com/UcaTiCE.png)

# centos 7 Change gcc Version
https://www.cnblogs.com/dj0325/p/8481092.html
```bash
scl --list
scl enable devtoolset-7 bash
```
![](https://i.imgur.com/ktlrnBU.png)

```bash
[root@localhost lib64]# mv libstdc++.so.6 libstdc++.so.6bck
[root@localhost lib64]# ln -s libstdc++.so.6.0.24 libstdc++.so.6
[root@localhost lib64]# strings /usr/lib64/libstdc++.so.6 | grep GLIBC
```
![](https://i.imgur.com/ImDzjy5.png)

# Install Cmake
cmake 3.43 or higher version required.
https://blog.csdn.net/cloudeagle_bupt/article/details/82498255
http://jotmynotes.blogspot.com/2016/10/updating-cmake-from-2811-to-362-or.html
![](https://i.imgur.com/cTcyy03.png)

![](https://i.imgur.com/8IrNTVp.png)


# Start Compile ffmpeg  LLVM bitcode

![](https://i.imgur.com/C5t0IRP.png)

![](https://i.imgur.com/iQGuhnT.png)

![](https://i.imgur.com/4iGe0Mz.png)

```bash
make
```
possibley get error but It's ok
![](https://i.imgur.com/w13jDtO.png)
```bash
file ffmpeg_g 
```
![](https://i.imgur.com/Colvmec.png)

这里放出我最终自己使用pre.js和post.js代码

https://github.com/disoul/videoconverter.js/blob/master/build/ffmpeg_pre.js
https://github.com/disoul/videoconverter.js/blob/master/build/ffmpeg_post.js
好啦好啦，扯了这么多，终于万事俱备可以愉快的开始最后一步编译啦

# Final Battle Compile LLVM to WebAssmbly
这里使用的命令依旧是emcc，但是注意此时emcc的输入为LLVM bitcode，它将会调用emscriptem来将其编译到js (和第一步emcc的行为不同，因为输入格式不同，target也会不同)
```bash
# 这里的ffmpeg是上一步编译输出的LLVM bitcode
cp ffmpeg ffmpeg.bc

# 最终的输出是 -o 指定的，这些 -s 参数的意义可以从emcc的文档中找到
# 这里打开了ALLOW_MEMORY_GROWTH是因为在移动端测试下会遇到内存(wasm/asm.js的虚拟内存)
# 不够的情况，默认内存大小是TOTAL_MEMORY指定的
# 设置WASM=1就会编译到WebAssembly,默认编译到asm.js
emcc -s ASSERTIONS=1 -s VERBOSE=1 -s TOTAL_MEMORY=33554432 \
-s ALLOW_MEMORY_GROWTH=1 -s WASM=1 -O2 -v ffmpeg.bc \
-o ../ffmpeg.js --pre-js ../ffmpeg_pre.js --post-js ../ffmpeg_post.js
```

```
emcc ffmpeg.bc -o ffmpeg.html -s TOTAL_MEMORY=33554432 

```

![](https://i.imgur.com/xZywvUo.png)


![](https://i.imgur.com/q33aM2N.png)

# Open Chrome Experimental WebAssmbly
![](https://i.imgur.com/gKKTZ0g.png)

add some html
index.html
```htmlmixed=
<html>
<p>ffmpeg.js</p>
<input id="file-input" type="file" />
</html>
<script>

var worker = new Worker('worker.js');
var inputElement = document.getElementById("file-input");
inputElement.addEventListener("change", handleFiles, false);
function handleFiles() {
var fileList = this.files; 
console.log(fileList)
worker.postMessage(fileList);
}
</script>
```

worker.js
```javascript=
self.importScripts('ffmpeg.js');

onmessage = function(e) {
  console.log('ffmpeg_run', ffmpeg_run);
  var files = e.data;
  console.log(files);
  ffmpeg_run({
   // arguments: ['-i', 'https://gw.alicdn.com/bao/uploaded/LB1l2iXISzqK1RjSZFjXXblCFXa.mp4?file=LB1l2iXISzqK1RjSZFjXXblCFXa.mp4', '-b:v', '64k', '-bufsize', '64k', '-vf', 'showinfo', '-strict', '-2', 'out.mp4'],
  // arguments: ['-i', '/input/' + files[0].name  'out.mp4'],
   arguments: ['-version'],
    //files: files,
  }, function(results) {
    console.log('result',results);
   // self.postMessage(results[0].data, [results[0].data]);
  });

}
```
enjoy~
