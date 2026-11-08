#!/bin/sh
# concat the 32 rendered chunks (video only) and mux the final mix: the mp4 has the same name as the mp3
set -e
cd /home/claude/fire/app/out/chunks
NAME="They Blew Up Houses to Stop a Fire"
ls c_*.mp4 | sort | sed "s/^/file '/; s/$/'/" > /home/claude/fire/app/out/list.txt
n=$(wc -l < /home/claude/fire/app/out/list.txt); echo "chunks: $n"
ffmpeg -y -loglevel error -f concat -safe 0 -i /home/claude/fire/app/out/list.txt -c copy /home/claude/fire/app/out/video_only.mp4
ffmpeg -y -loglevel error -i /home/claude/fire/audio/voice.wav -c:a libmp3lame -b:a 192k "/home/claude/fire/$NAME.mp3"
ffmpeg -y -loglevel error -i /home/claude/fire/app/out/video_only.mp4 -i /home/claude/fire/audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "/home/claude/fire/$NAME.mp4"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate,nb_frames -of compact "/home/claude/fire/$NAME.mp4"
