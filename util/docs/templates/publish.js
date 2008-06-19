function publish(symbolSet) {
  publish.conf = {  // trailing slash expected for dirs
    ext: "",
    outDir: JSDOC.opt.d || SYS.pwd+"../out/jsdoc/",
    templatesDir: SYS.pwd + "../../templates/",
    symbolsDir: "reference.html#"
  };
  // used to check the details of things being linked to
  Link.symbolSet = symbolSet;
  var symbols = symbolSet.toArray().sort(makeSortby("alias"));
  var referenceTemplate = new JSDOC.JsPlate(publish.conf.templatesDir + "reference.tmpl");
  var output = "";
  output = referenceTemplate.process(symbols);
  IO.saveFile(publish.conf.outDir, "reference2.html", output);
}

/** make a symbol sorter by some attribute */
function makeSortby(attribute) {
  return function(a, b) {
    if (a[attribute] != undefined && b[attribute] != undefined) {
      a = a[attribute].toLowerCase();
      b = b[attribute].toLowerCase();
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    }
  }
}

/** Find symbol {@link ...} strings in text and turn into html links */
function resolveLinks (str, from) {
  str = str.replace(/\{@link ([^} ]+) ?\}/gi,
    function(match, symbolName) {
      return "<code>" + new Link().toClass(symbolName) + "</code>";
    }
  );

  return str;
}