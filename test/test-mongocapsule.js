var should = require('should');
var Capsule = require('../capsules/mongo')

function testConnect()
{
	var capopt = {
        acc:"acc",coll:"coll",spec:"spec",
        makeid:"makeid"
      }
	var mongoCap = new Capsule(capopt); 
	mongoCap.connect();
	mongoCap.loadHistory();

}

function testHistory()
{

	var capopt = {
        acc:"acc",coll:"coll",spec:"spec",
        makeid:"makeid"
      }

	var mongoCap = new Capsule(capopt);
	var objToSave = { test : "test"} 
	mongoCap.save(objToSave, function(item){
			console.log("Saved : " + item._id);
	});
	
}

function cleanup()
{
	var capopt = {
        acc:"acc",coll:"coll",spec:"spec",
        makeid:"makeid"
      }

	var mongoCap = new Capsule(capopt);

	mongoCap.purge();
}


cleanup();
testHistory();
//load test
//save test
//remove test
//list test
//meta test
//history test
//self.items = []
//self.index = {}
//self.v = -1