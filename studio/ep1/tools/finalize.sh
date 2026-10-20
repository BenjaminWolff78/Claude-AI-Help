#!/bin/bash
# Encode the rendered frames, mux the mix, make the <30 MB copy, and run final-file QA.
set -e
cd /home/claude/claude-motion
python3 sfx/cues/raise.py /home/claude/work/ep1/audio2/final/voice.wav /home/claude/work/ep1/audio2/final/words.json out/raise/audio | tail -3
NAME=Can_A_Raise_Make_You_Poorer
DEL=/home/claude/work/ep1/deliver
SEQ=out/raise/seq_all
rm -rf $SEQ && mkdir -p $SEQ
for d in out/raise/full/c*/; do
  for f in $d*.jpeg; do
    n=$(basename $f .jpeg); n=${n#f}
    ln -sf "$(realpath $f)" $SEQ/$(printf "f%05d.jpeg" $((10#$n)))
  done
done
COUNT=$(ls $SEQ | wc -l)
echo "frames: $COUNT"
ffmpeg -y -loglevel error -framerate 30 -i $SEQ/f%05d.jpeg -i out/raise/audio/mix.wav \
  -map 0:v -map 1:a -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -tune animation \
  -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest $DEL/$NAME.mp4
# compressed copy under 30 MB: two-pass at a fixed video bitrate
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $DEL/$NAME.mp4)
VB=$(python3 -c "print(int((29.0*8*1024*1024/$DUR - 128000)*0.97))")
ffmpeg -y -loglevel error -i $DEL/$NAME.mp4 -c:v libx264 -preset medium -b:v 880k -maxrate 1200k -bufsize 2400k -pix_fmt yuv420p \
  -c:a aac -b:a 128k -movflags +faststart $DEL/${NAME}_small.mp4
ls -la $DEL/*.mp4
for f in $DEL/$NAME.mp4 $DEL/${NAME}_small.mp4; do
  echo "== $f"
  ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate -show_entries format=duration,size -of compact $f
  ffmpeg -nostats -i $f -af ebur128=peak=true -f null - 2>&1 | grep -A12 Summary | grep -E "I:|Peak:"
done
echo FINALIZE_DONE
