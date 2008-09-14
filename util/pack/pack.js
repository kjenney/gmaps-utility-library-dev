(function (a) {

  // load the supporting libraries
  var pwd = "util/pack/";
  load(pwd + "packer/rhino/lib/writeFile.js");
  load(pwd + "base2/src/base2.js");
  load(pwd + "packer/Packer.js");
  load(pwd + "packer/Words.js");

  // arguments
  var inFile = a[0];
  var outFile = a[1] || inFile.replace(/\.js$/, "_packed.js");

  // options
  var base62 = true;
  var shrink = true;

  // do the packing
  var script = readFile(inFile);
  var packer = new Packer;
  var packedScript = packer.pack(script, base62, shrink);

  // write the output
  writeFile(outFile, packedScript);

})(arguments);