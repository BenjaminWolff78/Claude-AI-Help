#!/bin/bash
set -e
cd /home/claude/claude-motion
python3 sfx/cues/raise.py /home/claude/work/ep1/audio2/final/voice.wav /home/claude/work/ep1/audio2/final/words.json out/raise/audio_mm | grep -E "final_|music|sfx|sting|voice" 
N=Can_A_Raise_Make_You_Poorer; D=/home/claude/work/ep1/deliver_mm
ffmpeg -y -loglevel error -framerate 30 -i out/raise/seq_mm/f%05d.jpeg -i out/raise/audio_mm/mix.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -tune animation -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest $D/$N.mp4
ffmpeg -y -loglevel error -i $D/$N.mp4 -c:v libx264 -preset medium -b:v 780k -maxrate 1000k -bufsize 2000k -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart $D/${N}_small.mp4
ls -l $D/*.mp4
for f in $D/$N.mp4 $D/${N}_small.mp4; do echo "== $f"; ffprobe -v error -show_entries format=duration,size -of compact $f; ffmpeg -nostats -i $f -af ebur128=peak=true -f null - 2>&1 | grep -A12 Summary | grep -E "I:|Peak:"; done
echo FIN_DONE
