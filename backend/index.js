// Dependencies
    const express = require('express')
    const admin = require('firebase-admin');
    let inspect = require('util').inspect;
    let Busboy = require('busboy');
    let path = require('path')
    let os = require('os')
    let fs = require('fs')
    let UUID = require('uuid-v4')
    let webpush = require('web-push')


// config - express
    const app = express()

// config firebase

    const serviceAccount = require('./serviceAccountKey.json');
        
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'gs://quasagram-c97e5.appspot.com'
    });

    const db = admin.firestore();
    let bucket = admin.storage().bucket();

// endpoint - posts

app.get('/posts', (request, response) => {
    
    response.set('Access-Control-Allow-Origin', '*')
    
    let posts = []
    db.collection('posts').orderBy('date', 'desc').get().then(snapshot =>  {
        
        snapshot.forEach((doc) => {
            posts.push(doc.data())
        });
        response.send(posts)
    })    
})

// endpoint-create

app.post('/createPost', (request, response) => {
    
    response.set('Access-Control-Allow-Origin', '*')

    let uuid = UUID()

    let fields = {}
    let fileData = {}

    var busboy = new Busboy({ headers: request.headers });

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);

      let filePath = path.join(os.tmpdir(), filename)
      file.pipe(fs.createWriteStream(filePath))
      fileData = {filePath, mimetype}
    });

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
       fields[fieldname] = val
    });

    busboy.on('finish', function() {

        bucket.upload(
            fileData.filePath,
            {
                uploadType: 'media',
                metadata:{
                    metadata: {
                        contentType: fileData.mimetype,
                        firebaseStorageDownloadTokens: uuid
                    }
                }
            },
            (err, uploadedFile) => {
                if(!err) {
                    createDocument(uploadedFile)
                }
            }
        )
       function createDocument(uploadedFile) {
        
        db.collection('posts').doc(fields.id).set({
            id: fields.id,
            caption: fields.caption,
            location: fields.location,
            date: parseInt(fields.date),
            imageUrl: `https://firebasestorage.googleapis.com/v0/b/${ bucket.name }/o/${ uploadedFile.name }?alt=media&token=${ uuid }`

         }).then(() => {
             sendPushNotification()
             response.send('Post added: ' + fields.id)
         })   
       }
    //   response.writeHead(303, { Connection: 'close', Location: '/' });
       function sendPushNotification() {
            let subscriptions = []
            db.collection('subscriptions').get().then(snapshot =>  {
                
                snapshot.forEach((doc) => {
                    subscriptions.push(doc.data())
                });
                return subscriptions
            }).then(subscriptions => {
                subscriptions.forEach(subscription => {
                    const pushSubscription = {
                        endpoint: subscription.endpoint,
                        keys: {
                          auth: subscription.keys.auth,
                          p256dh: subscription.keys.p256dh
                        }
                      };
                      
                      let pushContent = {
                          title: 'New Instagram Post!',
                          body: 'New Post Added! Check it out!'
                      }
                      let pushContentStringified = JSON.stringify(pushContent)
                      webpush.sendNotification(pushSubscription, pushContentStringified);
                })
            })  
       }
    });

    request.pipe(busboy); 
  
})

// config webpush

webpush.setVapidDetails(
    'mailto:test@test.org',
    'BC5QIUBo-Pi68RkSKoiQS_PNYIT2XE-xGTK5ofR1cfR4RJ9TPgvmwsZNEB03dqW-BuZhzou4QabUWOEeLt42l8g',
    'Waf93Ma2TW3K9G3RRAAdnUSBEqMG5eWfaUNqImXGJCQ'
  );

// endpoint-subscription

app.post('/createSubscription', (request, response) => {
    
    response.set('Access-Control-Allow-Origin', '*')

|   db.collection('subscriptions').add(request.query).then(docRef => {
        response.send({
            message: 'Subscription added',
            postData: request.query
        })
    })       
})


// listen 
    app.listen(process.env.PORT || 3000)