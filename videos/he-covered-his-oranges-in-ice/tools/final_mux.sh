#!/bin/sh
# concat the 33 rendered chunks (video only) and mux the final mix: the mp4 has the same name as the mp3
set -e
cd /home/claude/ship/app/out/chunks
NAME="Owners Sank Their Own Ships, So He Painted a Line"
ls c_*.mp4 | sort | sed "s/^/file '/; s/$/'/" > list.txt
n=$(wc -l < list.txt); echo "chunks: $n"
ffmpeg -y -loglevel error -f concat -safe 0 -i list.txt -c copy /home/claude/ship/app/out/video_only.mp4
ffmpeg -y -loglevel error -i /home/claude/ship/audio/voice.wav -c:a libmp3lame -b:a 192k "/home/claude/ship/$NAME.mp3"
ffmpeg -y -loglevel error -i /home/claude/ship/app/out/video_only.mp4 -i /home/claude/ship/audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "/home/claude/ship/$NAME.mp4"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate,nb_frames -of compact "/home/claude/ship/$NAME.mp4"
