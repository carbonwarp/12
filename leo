#!/usr/bin/env bash

synclink(){
	rm -rf AAA-PKG
	mkdir -p AAA-PKG

	for path in */; do
	    [[ -d "$path" ]] || continue

	    dir="${path%/}"
	    name="${dir##*/}"

	    nfpm="${name}.nfpm"
	    just="${name}.just"

	    [[ -f "$nfpm" && -f "$just" ]] || continue

	    mkdir -p "AAA-PKG/$name"

	    ln -s "../../$name" "AAA-PKG/$name/$name"
	    ln -s "../../$nfpm" "AAA-PKG/$name/$nfpm"
	    ln -s "../../$just" "AAA-PKG/$name/justfile"
	    ln -s "../../private.asc" "AAA-PKG/$name/private.asc"

	    echo "Linked: $name"
	done
}

mkpkg(){
	if [[ -f "$1".nfpm || -f "$1".just || -d "$1" ]]; then
		echo "Refusing to override."
	else
		mkdir "$1"
		touch "$1".{just,nfpm}
		synclink
		echo "done"
	fi
}


if [[ "$1" == "sync" ]]; then
	synclink

elif [[ "$1" == "init" ]]; then
	shift
	mkpkg "$@"
fi
