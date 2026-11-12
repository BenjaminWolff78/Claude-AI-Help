#!/bin/sh
# concat the rendered chunks (video only), apply the post grade, and mux the final mix: the mp4 has the same name as the mp3
# post grade (v2): gamma 1.25 lifts the night mids toward the board nights without clipping (blacks stay lifted by the
# in-render grade), saturation +20% (the gamma lift alone drops HSV saturation to 0.40), a light unsharp to give back edge detail the lens pass softens
set -e
NAME="He Covered His Oranges in Ice to Stop Them Freezing"
O=/home/claude/proj/app/out C=/home/claude/proj/app/out/chunks
ls "$C" | grep -E '^c_[0-9]{4}\.mp4$' | sort | sed "s#^#file '$C/#; s#\$#'#" > $O/list.txt
n=$(wc -l < $O/list.txt); echo "chunks: $n"
# decode-based concat (concat filter): chunks may come from different encoders (a split chunk is re-encoded), so no -c copy
set -- ; k=0; for c in $(ls "$C" | grep -E '^c_[0-9]{4}\.mp4$' | sort); do set -- "$@" -i "$C/$c"; k=$((k+1)); done
ffmpeg -y -loglevel error "$@" -filter_complex "concat=n=$k:v=1:a=0,eq=gamma=1.25:saturation=1.2,unsharp=5:5:0.7:5:5:0[v]" -map "[v]" -c:v libx264 -preset medium -crf 15 -pix_fmt yuv420p -r 30 $O/video_graded.mp4
ffmpeg -y -loglevel error -i $O/video_graded.mp4 -i /home/claude/proj/audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "/home/claude/proj/out/$NAME.mp4"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate,nb_frames -of compact "/home/claude/proj/out/$NAME.mp4"
