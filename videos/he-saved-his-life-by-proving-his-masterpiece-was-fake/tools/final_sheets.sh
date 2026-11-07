#!/bin/sh
# v10.10 QA sheets from the final render: mouth/face strips for both quoted lines + title-object frames
F="$1"; O=/home/claude/forger/look/final; mkdir -p $O
sel() { echo "$1" | tr ',' '\n' | sed 's/.*/eq(n,&)/' | paste -sd+; }
Q1=$(seq 392 3 450 | paste -sd,); Q2=$(seq 1157 3 1217 | paste -sd,)
ffmpeg -loglevel error -y -i "$F" -vf "select='$(sel $Q1)',crop=1080:900:0:700,scale=200:-1,drawtext=text='%{n}':x=4:y=4:fontsize=18:fontcolor=white:box=1:boxcolor=black,tile=10x2" -frames:v 1 $O/Q1_mouths.jpg
ffmpeg -loglevel error -y -i "$F" -vf "select='$(sel $Q2)',crop=1080:1080:0:200,scale=200:-1,drawtext=text='%{n}':x=4:y=4:fontsize=18:fontcolor=white:box=1:boxcolor=black,tile=10x2" -frames:v 1 $O/Q2_mouths.jpg
T="0,60,250,330,700,760,830,870,1060,1300,1400,1480,1560,1620"
ffmpeg -loglevel error -y -i "$F" -vf "select='$(sel $T)',scale=240:-1,tile=7x2" -frames:v 1 "$O/title_object.jpg"
