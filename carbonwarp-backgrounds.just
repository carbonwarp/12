default:
  rm -rf carbonwarp-backgrounds/dist
  mkdir -p carbonwarp-backgrounds/dist
  nfpm package   --config carbonwarp-backgrounds.nfpm   --packager rpm   --target carbonwarp-backgrounds/dist
  mv carbonwarp-backgrounds/dist/*.rpm carbonwarp-backgrounds/dist/carbonwarp-backgrounds.rpm
