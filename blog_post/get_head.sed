/<head>.*<\/head>/ {
 s/<head>(.*)<\/head>/\1/
 p
 q
}

/<head>/,/<\/head>/ {
 s/^.*<head>//
 s/<\/head>.*$//
 p
}
