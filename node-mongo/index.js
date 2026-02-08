const { MongoClient } = require("mongodb-legacy");
const assert = require("assert");

const url = 'mongodb://127.0.0.1:27017/';
const dbName = 'nucampsite';

MongoClient.connect(url, {}, (err, client) => {
    assert.strictEqual(err, undefined);

    console.log('Connected correctly to server');

    const db = client.db(dbName);

    db.dropCollection("campsites", (err, result) => {
        assert.strictEqual(err, undefined);

        console.log('Dropped Collection', result);

        const collection = db.collection('campsites');

        const documentToInsert = { name: 'Breadcrumb Trail Campground', description: 'Test' };

        collection.insertOne(documentToInsert, (err, result) => {
            assert.strictEqual(err, undefined);

            console.log('Insert Document:', {
                _id: result.insertedId,
                ...documentToInsert
            });

            collection.find().toArray((err, docs) => {
                assert.strictEqual(err, undefined);

                console.log('Found Documents:', docs);

                client.close();
            });
        });
    });
});