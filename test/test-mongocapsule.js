var should = require('should');
var Capsule = require('../capsules/mongo')

function testHistory()
{
	var capopt = {
        acc:"acc",coll:"coll",spec:"spec",
        makeid:"makeid"
      }

	var mongoCap = new Capsule(capopt); 
	mongoCap.history.length.should.equal(0);
}

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