# build_ffmpeg.js

Build scripts and a worker harness for compiling **FFmpeg to WebAssembly**, so a
browser page can transcode media locally — no upload, no server-side encoder.

![](https://i.imgur.com/yUFRvAE.png)
![](https://i.imgur.com/7oeSCLz.png)

## Contents

| Path | Purpose |
|---|---|
| `ffmpeg.js`, `ffmpeg.wasm` | the built artefacts |
| `worker.js` | runs FFmpeg off the main thread |
| `index.html` | demo page |
| `testing/` | FLV.js playback experiments |
| `SampleVideo_1280x720_1mb.mp4`, `small.ogv`, `small.webm` | test inputs |

## Toolchain

- Emscripten `emcc` **v1.38.38**
- [FFmpeg](https://github.com/FFmpeg/FFmpeg.git)

```bash
git clone https://github.com/juj/emsdk && cd emsdk
./emsdk install  sdk-incoming-64bit binaryen-master-64bit
./emsdk activate sdk-incoming-64bit binaryen-master-64bit
. ./emsdk_env.sh
```

## Configure

Almost everything is disabled on purpose. A default FFmpeg build produces a
`.wasm` too large to ship and too slow to instantiate, so only the demuxers,
decoders and protocols actually needed survive:

```bash
CPPFLAGS="-D_POSIX_C_SOURCE=200112 -D_XOPEN_SOURCE=600" \
emconfigure ./configure --cc="emcc" \
  --prefix=$(pwd)/../dist --enable-cross-compile --target-os=none \
  --arch=x86_64 --cpu=generic \
  --disable-ffplay --disable-ffprobe \
  --disable-asm --disable-doc --disable-devices --disable-pthreads \
  --disable-w32threads --disable-hwaccels \
  --disable-parsers --disable-bsfs --disable-debug --disable-protocols \
  --disable-indevs --disable-outdevs \
  --enable-protocol=file --enable-protocol=rtmp --enable-protocol=pipe \
  --enable-protocol=tcp --enable-network \
  --enable-demuxer=rtsp --enable-demuxer=flv \
  --enable-decoder=h264 --enable-encoder=libx264
```

`--disable-asm` and `--disable-pthreads` are not optional: the hand-written
assembly has no WebAssembly target, and threads require SharedArrayBuffer,
which needs cross-origin isolation headers the demo page does not set.

Add `--enable-small` if the build runs the Emscripten optimiser out of memory
(`JavaScript heap out of memory`).

## Link

Plain build:

```bash
emcc -s ASSERTIONS=1 -s VERBOSE=1 -s TOTAL_MEMORY=33554432 \
  -s ALLOW_MEMORY_GROWTH=1 -s WASM=1 -O2 -v ffmpeg.bc \
  -o ../ffmpeg.js --pre-js ./pre.js --post-js ./post.js
```

Async build, for input that arrives progressively rather than as one in-memory
buffer:

```bash
emcc -s ASSERTIONS=1 -s VERBOSE=1 -s TOTAL_MEMORY=33554432 \
  -s EMTERPRETIFY=1 -s EMTERPRETIFY_ASYNC=1 \
  -s EMTERPRETIFY_WHITELIST='["_main","_ffmpeg_parse_options","_open_files","_open_input_file","_avformat_open_input","_ff_id3v2_read","_id3v2_read_internal","_avio_read","_fill_buffer","_io_read_packet","_ffurl_read","_file_read","_avformat_find_stream_info","_read_frame_internal","_ff_read_packet","_rawvideo_read_packet","_av_get_packet","_append_packet_chunked","_transcode","_av_read_frame"]' \
  -s BINARYEN_TRAP_MODE=js -s ALLOW_MEMORY_GROWTH=1 -s WASM=1 \
  --js-library ./library.js -O3 -v ffmpeg.bc \
  -o ./ffmpeg.js --pre-js ./ffmpeg_pre.js --post-js ./ffmpeg_worker.js
```

The whitelist is the whole trick. FFmpeg's read path is synchronous all the way
down from `transcode()` to `file_read()`, but a browser cannot block — so every
function on that call chain has to be listed for Emterpreter so it can be
suspended and resumed when data is not yet available. Miss one and the page
hangs instead of erroring.

Then:

```bash
make
```

## Licensing — read before shipping

The build scripts in this repository are MIT (see [LICENSE](LICENSE)).

**The FFmpeg binary you produce is not.** FFmpeg is LGPL-2.1 by default, and
the configure line above enables `libx264`, which is **GPL-2.0**. Building with
it makes the resulting `ffmpeg.js` / `ffmpeg.wasm` a GPL work, so shipping it in
a page means complying with the GPL — including offering source. Drop
`--enable-encoder=libx264` if you need to stay LGPL.

## Reference

- <https://trac.ffmpeg.org/wiki/CompilationGuide/Centos>
