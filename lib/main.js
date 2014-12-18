var knox = require('knox');
var MongoClient = require('mongodb').MongoClient;
var async = require('async');


/**
 * Main backup function that performs the task
 * @param mongoUri
 * @param awsKey
 * @param awsSecret
 * @param bucket
 * @param cb
 */
function backup(mongoUri, awsKey, awsSecret, bucket, cb) {
  dumpMongo(mongoUri, function (err, result) {
    if (err) {
      cb(err);
      return err;
    }
    uploadToAws(awsKey, awsSecret, bucket, result, function (err, result) {
      cb(err, result);
    })
  })
}

function dumpMongo(mongoUri, cb) {
  var result = {};
  MongoClient.connect(mongoUri, function (err, db) {
    if (err) {
      cb(err);
      return;
    }

    db.collectionNames(function (err, names) {
      async.each(names, function (name, asyncCallback) {
        var colName = name.name.split(".");
        colName.shift();
        colName = colName.join('.');

        if(!colName.match(/\$/)){
          db.collection(colName).find().toArray(function(err, docs){
            result[colName] = docs;
            asyncCallback();
          })
        } else {
          console.log("Could not backup " + colName + "because it has an invalid name");
          asyncCallback();
        }
      }, function (err) {
        cb(err, result);
      });
    });
  })
}

function clearOld(cb) {
  if (cb) cb();
}

function uploadToAws(awsKey, awsSecret, bucket, data, cb) {

  var client = getClient(awsKey, awsSecret, bucket);

  if (typeof(data) !== "String") {
    data = JSON.stringify(data);
  }

  var req = client.put('/backup/' + new Date().toISOString() + '.json', {
    'Content-Length': data.length
    , 'Content-Type': 'application/json'
  });
  req.on('response', function (res) {
    if (200 == res.statusCode) {
      cb(undefined, 200);
    } else {
      cb(res.statusCode);
    }
  });
  req.end(data);
}

function download(file, awsKey, awsSecret, bucket, cb) {

  var client = getClient(awsKey, awsSecret, bucket);
  var result;

  client.get(file).on('response', function (res) {
    res.on('data', function(chunk){
      result += chunk;
    })
    res.on('end', function(){
      cb(result);
    })
  }).end();

}

function restore(file, mongoUrl, awsKey, awsSecret, bucket, cb){

}

function getClient(awsKey, awsSecret, bucket) {
  return knox.createClient({
    key: awsKey,
    secret: awsSecret,
    bucket: bucket
  });
}

module.exports = {
  backup: backup,
  restore: restore,
  __clearOld: clearOld,
  __uploadToAws: uploadToAws,
  __dumpMongo: dumpMongo
};
