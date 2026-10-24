#!/bin/bash
set -e
cd /home/claude/samoa
ffmpeg -y -loglevel error -i out/sub8.mp4 -i audio/mix_final.wav -filter_complex \
 "[0:v]format=gbrp16le,tmix=frames=8,select='eq(mod(n\,8)\,7)',setpts=N/30/TB,scale=in_range=pc:out_range=tv,format=yuv420p,noise=alls=2:allf=t[v]" \
 -map "[v]" -map 1:a:0 -r 30 -c:v libx264 -crf 19 -preset slow -tune grain -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
 -c:a aac -b:a 224k -movflags +faststart -shortest out/samoa_skipped_a_day.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames,pix_fmt:format=duration -of compact out/samoa_skipped_a_day.mp4
ffmpeg -nostats -i out/samoa_skipped_a_day.mp4 -map 0:a:0 -af ebur128=peak=true -f null - 2>&1 | grep -A12 Summary | grep -E "I:|Peak"
