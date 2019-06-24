#!/usr/bin/env bash
cd "$(dirname "$(readlink -f "$0" || realpath "$0")")"
pwd

mkdir ../oatml/
mkdir ../oatml/dist

cp -r assets ../oatml/
cp ../dist/template.v2.* ../oatml/dist

./build.sh

cat > ../oatml/2019-06-24-batchbald.html <<EOF
---
title: "Human in the Loop: Deep Learning without Wasteful Labelling"
image:  /blog/2019/06/24/assets/teaser.png
slug: batchbald
author:
  - ak
  - ja
  - yg
blurb: |
  In <em>Active Learning</em> we use a “human in the loop” approach to data labelling, making machine learning applicable when labelling costs would be too high otherwise.
  In our paper
  <a href="https://arxiv.org/abs/1906.08158">[1]</a>
  we present BatchBALD: a new <em>practical</em> method for choosing batches of informative points in Deep Active Learning which
  avoids labelling redundancies that plague existing methods. Our approach is based on information theory and expands
  on useful intuitions. We have also made our implementation available on GitHub:
  <a href="https://github.com/BlackHC/BatchBALD">https://github.com/BlackHC/BatchBALD</a>.
layout: distill-prerendered
head: |
$(sed -E -n -f get_head.sed ../public/index.html | awk '{ print "  " $0 }')
---
$(sed -E -n -f get_body.sed ../public/index.html)
EOF
