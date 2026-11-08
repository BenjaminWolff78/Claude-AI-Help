#!/bin/sh
# v10.12 QA sheets from the final crumple render: mouth strips for both quoted lines, title-object frames,
# a 1 s contact sheet of the whole film (captions vs faces / painted text).
F="$1"; O=/home/claude/crumple/look/final; mkdir -p $O
sel() { echo "$1" | tr ',' '\n' | sed 's/.*/eq(n,&)/' | paste -sd+; }
Q1=$(seq 527 2 570 | paste -sd,); Q2=$(seq 1821 3 1880 | paste -sd,)
ffmpeg -loglevel error -y -i "$F" -vf "select='$(sel $Q1)',crop=1080:900:0:500,scale=200:-1,drawtext=text='%{n}':x=4:y=4:fontsize=18:fontcolor=white:box=1:boxcolor=black,tile=11x2" -frames:v 1 $O/Q1_mouths.jpg
ffmpeg -loglevel error -y -i "$F" -vf "select='$(sel $Q2)',crop=1080:1080:0:300,scale=200:-1,drawtext=text='%{n}':x=4:y=4:fontsize=18:fontcolor=white:box=1:boxcolor=black,tile=10x2" -frames:v 1 $O/Q2_mouths.jpg
T="0,60,100,630,700,800,830,860,960,1300,1400,1430,1620,1690"
ffmpeg -loglevel error -y -i "$F" -vf "select='$(sel $T)',scale=240:-1,tile=7x2" -frames:v 1 "$O/title_object.jpg"
ffmpeg -loglevel error -y -i "$F" -vf "select='not(mod(n\,30))',scale=180:320,drawtext=text='%{n}':x=4:y=4:fontsize=16:fontcolor=white:box=1:boxcolor=black,tile=11x6" -frames:v 1 "$O/contact_1s.jpg"
echo SHEETS_DONE
