var fs = require("fs");
var path = require("path");
var should = require("should");
var webpack = require("webpack");

var packages = fs.readdirSync(path.join(__dirname, "packages"));

var packagesDir = path.join(__dirname, "packages");
var distsDir = path.join(__dirname, "dists");

function fileContent(path) {
  try {
    return fs.readFileSync(path, "utf-8");
  } catch(e){}
  return "";
}

function compareFiles(file_actual,file_expected) {
  actual = fileContent(file_actual);
  expected = fileContent(file_expected);
  var eq = actual === expected;
  if( ! eq ) try {
    actual = JSON.parse(actual);
    expected = JSON.parse(expected);
  } catch(e){}
  actual.should.be.deepEqual(expected,
    " file '"+file_actual+"' should be deep eqaual to '"+file_expected+"'");
}

describe("TestPackages", function() {
  packages.forEach(function(testCase) {
    it(testCase, function(done) {
      var caseDir = path.join(packagesDir, testCase);
      var distDir = path.join(distsDir, testCase);

      var options = { entry: { test: "./index.js" } };
      var webpackConfig = path.join(caseDir, "webpack.config.js");
      if(fs.existsSync(webpackConfig))
        options = require(webpackConfig);
      options.context = caseDir;
      if(!options.output) options.output = { filename: "[name].js" };
      if(!options.output.path) options.output.path = distDir;
      var expectedDir = path.join(caseDir, "expected");

      fs.readdirSync(expectedDir).forEach(function(file) {
        var actualPath = path.join(distDir, file);
        if( fs.existsSync(actualPath) )
          fs.unlinkSync(actualPath);
      });

      webpack(options, function(err, stats) {
        if(err) return done(err);
        if(stats.hasErrors()) return done(new Error(stats.toString()));

        fs.readdirSync(expectedDir).forEach(function(file) {
          var filePath = path.join(expectedDir, file);
          var actualPath = path.join(distDir, file);
          compareFiles(actualPath,filePath);
        });

        var bundle = require(path.join(distDir,'bundle.js'));
        bundle(distDir).should.be.equal('ok');

        done();
      });
    });
  });
});
