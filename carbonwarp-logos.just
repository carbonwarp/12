default:
  rm -rf carbonwarp-logos/dist
  mkdir carbonwarp-logos/dist
  nfpm package --config carbonwarp-logos.nfpm --packager rpm --target carbonwarp-logos/dist
  mv carbonwarp-logos/dist/carbonwarp-logos*.rpm carbonwarp-logos/dist/carbonwarp-logos.rpm
