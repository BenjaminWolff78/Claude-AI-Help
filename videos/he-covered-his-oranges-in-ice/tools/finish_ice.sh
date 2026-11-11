#!/bin/sh
# concat the rendered chunks (video only) and mux the final mix: the mp4 has the same name as the mp3
set -e
NAME="He Covered His Oranges in Ice to Stop Them Freezing"
C=/home/claude/proj/app/out/chunks
ls "$C" | grep -E '^c_[0-9]{4}\.mp4$' | sort | sed "s#^#file '$C/#; s#\$#'#" > /home/claude/proj/app/out/list.txt
n=$(wc -l < /home/claude/proj/app/out/list.txt); echo "chunks: $n"
ffmpeg -y -loglevel error -f concat -safe 0 -i /home/claude/proj/app/out/list.txt -c copy /home/claude/proj/app/out/video_only.mp4
ffmpeg -y -loglevel error -i /home/claude/proj/app/out/video_only.mp4 -i /home/claude/proj/audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "/home/claude/proj/out/$NAME.mp4"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate,nb_frames -of compact "/home/claude/proj/out/$NAME.mp4"
