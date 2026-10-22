#!/bin/bash
# concat chunks -> mux the mix -> master + small copy
set -e
C=/root/sun/chunks; D=/home/claude/work/sun/deliver
ls $C/c???.mp4 | sed "s/^/file '/; s/$/'/" > $C/list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i $C/list.txt -c copy /root/sun/silent.mp4
ffmpeg -y -loglevel error -i /root/sun/silent.mp4 -i /root/sun/audio/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -movflags +faststart -shortest "$D/The_Long_Way_Out.mp4"
ffmpeg -y -loglevel error -i "$D/The_Long_Way_Out.mp4" -c:v libx264 -preset slow -vf scale=1280:720:flags=lanczos -b:v 1100k -maxrate 1600k -bufsize 3200k -pass 1 -an -f null /dev/null -passlogfile /root/sun/p2
ffmpeg -y -loglevel error -i "$D/The_Long_Way_Out.mp4" -c:v libx264 -preset slow -vf scale=1280:720:flags=lanczos -b:v 1100k -maxrate 1600k -bufsize 3200k -pass 2 -passlogfile /root/sun/p2 -c:a aac -b:a 128k -movflags +faststart "$D/The_Long_Way_Out_small.mp4"
ls -la $D
