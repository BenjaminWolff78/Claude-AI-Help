#!/bin/bash
set -e
cd /home/claude/p8/app/out/chunks
ls c_*.mp4 | grep -v part | sort | sed "s|^|file '/home/claude/p8/app/out/chunks/|; s|$|'|" > /tmp/skull_list.txt
n=$(wc -l < /tmp/skull_list.txt); echo "chunks $n"
mkdir -p /home/claude/p8/final
ffmpeg -v error -y -f concat -safe 0 -i /tmp/skull_list.txt -c copy /home/claude/p8/final/video_raw.mp4
# final light pass (kit: brightness 98 LOW, near-black HIGH): lift the shadows a little, whites untouched
ffmpeg -v error -y -i /home/claude/p8/final/video_raw.mp4 -vf "curves=all='0/0.035 0.25/0.295 0.5/0.55 0.75/0.79 1/1'" -c:v libx264 -crf 15 -preset veryfast -pix_fmt yuv420p -r 30 /home/claude/p8/final/video.mp4
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 /home/claude/p8/final/video.mp4); echo "video $D s"
T="The Skull That Was Worth More in Pieces"
ffmpeg -v error -y -i /home/claude/p8/audio/mix.wav -t "$D" -c:a libmp3lame -b:a 192k "/home/claude/p8/final/$T.mp3"
ffmpeg -v error -y -i /home/claude/p8/final/video.mp4 -i /home/claude/p8/audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -ar 48000 -t "$D" -movflags +faststart "/home/claude/p8/final/$T.mp4"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,duration -of compact "/home/claude/p8/final/$T.mp4"
