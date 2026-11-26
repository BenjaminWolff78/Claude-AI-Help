#!/bin/bash
# usage: assemble13.sh   (joins the drip chunks, makes the mp3 from the voice and muxes the mix; no grade pass: the grade is in the render)
set -e
cd /home/claude/p13/app/out/chunks
ls c_*.mp4 | grep -v part | sort | sed "s|^|file '/home/claude/p13/app/out/chunks/|; s|$|'|" > /tmp/p13_list.txt
echo "chunks $(wc -l < /tmp/p13_list.txt)"
F=/home/claude/p13/final; mkdir -p $F
ffmpeg -v error -y -f concat -safe 0 -i /tmp/p13_list.txt -c copy $F/video.mp4
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $F/video.mp4); echo "video $D s"
T="Why He Let His Tap Drip All Night in the Freeze"
ffmpeg -v error -y -i /home/claude/p13/audio/voice_final.wav -t "$D" -c:a libmp3lame -b:a 192k "$F/$T.mp3"
ffmpeg -v error -y -i $F/video.mp4 -i /home/claude/p13/audio/mix_final.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -ar 48000 -t "$D" -movflags +faststart "$F/$T.mp4"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,duration -of compact "$F/$T.mp4"
