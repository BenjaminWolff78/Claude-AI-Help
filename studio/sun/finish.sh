#!/bin/bash
# concat chunks -> 1080p60 master (crf 19) with the mix -> 720p small copy (< 30 MB)
set -e
C=/root/sun/chunks; D=/home/claude/work/sun/deliver; mkdir -p $D
ls $C/c???.mp4 | sed "s/^/file '/; s/$/'/" > $C/list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i $C/list.txt -c copy /root/sun/silent.mp4
ffmpeg -y -loglevel error -i /root/sun/silent.mp4 -i /root/sun/audio/mix.wav -map 0:v -map 1:a -c:v libx264 -preset medium -crf 19 -tune film -pix_fmt yuv420p -c:a aac -b:a 256k -movflags +faststart -shortest "$D/The_Long_Way_Out.mp4"
V="-vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow -b:v 1100k -maxrate 1600k -bufsize 3200k"
ffmpeg -y -loglevel error -i "$D/The_Long_Way_Out.mp4" $V -pass 1 -passlogfile /root/sun/p2 -an -f null /dev/null
ffmpeg -y -loglevel error -i "$D/The_Long_Way_Out.mp4" $V -pass 2 -passlogfile /root/sun/p2 -c:a aac -b:a 128k -movflags +faststart "$D/The_Long_Way_Out_small.mp4"
ls -la $D
