var assert = require('assert');
var app = require('./../index');
var data = require('./data');


describe('dumpMongo', function() {
  it('shouldnt throw an error', function(done) {
    this.timeout(5000);
    app.__dumpMongo("mongodb://localhost/test", function(err, result){
      assert.equal(err, undefined);
      done();
    });
  });

  it('should return some items', function(done){
    app.__dumpMongo("mongodb://localhost/test", function(err, result){
      assert.notEqual(result.length, 0); //Returned some items
      done();
    })
  });

  it("should return the system.index collection", function(done){
    app.__dumpMongo("mongodb://localhost/test", function(err, result){
      assert.notEqual(result['system.indexes'], undefined);
      done();
    })
  });

  it('should return items with objects', function(done){
    app.__dumpMongo("mongodb://localhost/test", function(err, result){
      assert.notEqual(Object.keys(result['system.indexes']).length, 0);
      done();
      console.log(JSON.stringify(result));
    })
  });
});

describe("uploadToAws", function(){
  this.timeout(20000);
  data = JSON.stringify(data);
  it('should not error out', function(done){
    app.__uploadToAws(process.env.AWS_KEY, process.env.AWS_SECRET, process.env.AWS_BUCKET, data, function(err, result){
      assert.equal(err, undefined);
      done();
    })
  });
})

describe.only("end to end", function(){
  it("should backup the test database and save it to amazon", function(done){
    app.backup(process.env.MONGODB_URI, process.env.AWS_KEY, process.env.AWS_SECRET, process.env.AWS_BUCKET, function(err, result){
      assert.equal(err, undefined);

      done();
    })
  })
})
