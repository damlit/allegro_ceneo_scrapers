const mongoClient = require("mongodb").MongoClient;

const url = "mongodb+srv://smart_review:dfyMpAky0AOryxfL@cluster0.frhd4.mongodb.net/smart-review?retryWrites=true&w=majority";
const dbname = "smart-review";

class SmartReviewDb {

    async connectAndDoFunction(func) {
        return new Promise(
            function(resolve, reject){
                mongoClient.connect(url, {}, (error, client) => {
                    if (error) {
                        console.log("Cannot connect to db");
                    } else {
                        console.log("Database connection established: " + dbname);
                    };    
                    const db = client.db(dbname);
                    resolve(func(db));
                    client.close();
                }
            );
            }
        )
    }

    async connectAndReturnWithFunction(func) {
        return new Promise(
            function(resolve, reject){
                mongoClient.connect(url, {}, (error, client) => {
                    if (error) {
                        console.log("Cannot connect to db");
                        reject(error);
                    } else {
                        console.log("Database connection established: " + dbname);
                        const db = client.db(dbname);
                        resolve(func(db));
                        client.close();
                    };    
                }
            );
        })
    }

    async getFirstObjectFromQueue() {
        const sort = { createdOn: 1 };
        return await this.connectAndReturnWithFunction(function(db) {
            return new Promise(
                function(resolve, reject){
                    db.collection("productQueue")
                        .find({})
                        .sort(sort)
                        .toArray(function(error, docs) {
                            if (error) {
                                reject(error);
                            }
                            resolve(docs[0]);
                        });
        })
    });
    }

    async deleteFromBaseById(collection, id) {
        var query = {_id: id };
        await this.connectAndDoFunction(function(db) {
            db.collection(collection)
            .deleteOne(query);
        })
    }

    async addProductToDb(collection, product) {
        await this.connectAndDoFunction(function(db) {
            db.collection(collection).insertOne(product);  
            console.log("Product " + product.name + " has been added.");
        })   
    }

    async getFromBaseByName(collection, keywordInName) {
        var query = {name: new RegExp("." + keywordInName + ".") };
        return await this.connectAndReturnWithFunction(function(db) {
            return db.collection(collection)
                    .findOne(query);
        })
    }

    async printFromBase(collection, keywordInName) {
        var query = {name: new RegExp("." + keywordInName + ".") };
        await this.connectAndDoFunction(function(db) {
            db.collection(collection)
            .find({query})
            .forEach(pr => {console.log(pr)});
        })
    }

    async printCollectionCount(collection) {
        return await this.connectAndDoFunction(function(db) {
            db.collection(collection)
                  .count({}, function(err, result) {
                      console.log("Count in " + collection + " = " + result);
                      return true;
                  });
        })
    }
}

module.exports = SmartReviewDb;