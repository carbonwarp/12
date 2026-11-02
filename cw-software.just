default:
  rm -rf cw-software/dist
  mkdir -p cw-software/dist
  nfpm package   --config cw-software.nfpm   --packager rpm   --target cw-software/dist/
