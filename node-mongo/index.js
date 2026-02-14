const { MongoClient } = require('mongodb-legacy');
const assert = require('assert');
const dboper = require('./operations');

const url = 'mongodb://127.0.0.1:27017/';
const dbName = 'nucampsite';

MongoClient.connect(url, {}, (err, client) => {
    assert.strictEqual(err, undefined);

    console.log('Connected correctly to server');

    const db = client.db(dbName);

    db.dropCollection('campsites', (err, result) => {
        assert.strictEqual(err, undefined);

        console.log('Dropped Collection', result);

        const documentToInsert = { name: 'Breadcrumb Trail Campground', description: 'Test' };

        dboper.insertDocument(db, documentToInsert, 'campsites', result => {
            console.log('Insert Document:', {
                _id: result.insertedId,
                ...documentToInsert,
            });

            dboper.findDocuments(db, 'campsites', docs => {
                console.log('Found Documents:', docs);

                dboper.updateDocument(db, { name: 'Breadcrumb Trail Campground'}, 
                    { description: 'Updated Test Description' }, 'campsites', result => {
                        console.log('Updated Document Count:', result.modifiedCount);

                        dboper.findDocuments(db, 'campsites', docs => {
                            console.log('Found Documents:', docs);

                            dboper.removeDocument(db, { name: 'Breadcrumb Trail Campground'},
                                'campsites', result => {
                                    console.log('Deleted Document Count:', result.deletedCount);

                                    client.close();
                                }
                            )
                        })
                    })
            })
        })
        
    });
});
