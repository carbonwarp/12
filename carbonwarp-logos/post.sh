#! /usr/bin/env bash
set -e

dconf update
mv /etc/favicon_.png /etc/favicon.png
echo "done"
