/<body distill-prerendered="">.*<\/body>/ {
 s/<body distill-prerendered="">(.*)<\/body>/\1/
 p
 q
}

/<body distill-prerendered="">/,/<\/body>/ {
 s/^.*<body distill-prerendered="">//
 s/<\/body>.*$//
 p
}
