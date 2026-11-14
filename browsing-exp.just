default: get_bin package

get_bin:
  rm -rf browsing-exp/upstream_bin
  mkdir browsing-exp/upstream_bin 
  curl -Lo browsing-exp/upstream_bin/browser-ext.crx https://github.com/carbonwarp/12/releases/download/browser-ext-latest/browser-ext.crx
  curl -Lo browsing-exp/upstream_bin/update.xml https://github.com/carbonwarp/12/releases/download/browser-ext-latest/update.xml
  
package:
  rm -rf browsing-exp/dist/
  mkdir browsing-exp/dist
  nfpm package --config browsing-exp.nfpm --packager rpm --target browsing-exp/dist
  mv browsing-exp/dist/browsing-exp*.rpm browsing-exp/dist/browsing-exp.rpm
