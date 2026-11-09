default:
  rm -rf clearui/dist
  mkdir -p clearui/dist
  nfpm package   --config clearui.nfpm   --packager rpm   --target clearui/dist
  mv clearui/dist/*.rpm clearui/dist/clearui.rpm
