#!/bin/bash
# usage: assemble11.sh [vf]   (vf = optional final light pass filter; empty = copy)
set -e
cd /home/claude/p10/app/out/chunks
ls c_*.mp4 | grep -v part | sort | sed "s|^|file '/home/claude/p10/app/out/chunks/|; s|$|'|" > /tmp/p11_list.txt
echo "chunks $(wc -l < /tmp/p11_list.txt)"
F=/home/claude/p11/final; mkdir -p $F
ffmpeg -v error -y -f concat -safe 0 -i /tmp/p11_list.txt -c copy $F/video_raw.mp4
if [ -n "$1" ]; then ffmpeg -v error -y -i $F/video_raw.mp4 -vf "$1" -c:v libx264 -crf 15 -preset veryfast -pix_fmt yuv420p -r 30 $F/video.mp4; else cp $F/video_raw.mp4 $F/video.mp4; fi
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $F/video.mp4); echo "video $D s"
T="The Thieves Who Stole 200 Shoes Nobody Can Wear"
ffmpeg -v error -y -i /home/claude/p11/audio/voice.wav -t "$D" -c:a libmp3lame -b:a 192k "$F/$T.mp3"
ffmpeg -v error -y -i $F/video.mp4 -i /home/claude/p11/audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -ar 48000 -t "$D" -movflags +faststart "$F/$T.mp4"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,duration -of compact "$F/$T.mp4"
