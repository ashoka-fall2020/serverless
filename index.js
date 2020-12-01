const aws = require("aws-sdk");
aws.config.update({ region: "us-east-1" });
const ses = new aws.SES();
exports.handler = function(event, context, callback) {
    console.log("AWS lambda and SES");
    console.log(event);
    const message = event.Records[0].Sns.Message;
    let messageJson = JSON.parse(message);
    let data = JSON.parse(messageJson.data);
    let currentTime = new Date().getTime();
    let ttl = 60 * 60 * 1000;
    let expirationTime = (currentTime + ttl).toString();
    console.log(message);
    console.log(data);
    console.log(data.Email);
    let emailParams = {
        Destination: {
            ToAddresses: [
                data.Email
            ]
        },
        Message: {
            Body: {
                Text: {
                    Charset: "UTF-8",
                    Data: "Data: "+ data.Message
                }
            },
            Subject: {
                Charset: "UTF-8",
                Data:data.Subject
            }
        },
        Source: "webapp@dev.aashok.me"
    };

    let ddb = new aws.DynamoDB({apiVersion: '2012-08-10'});
    let storeData = {
        TableName: "csye6225",
        Item: {
            id: { S: data.Email },
            data: { S:  message},
            ttl: { N: expirationTime }
        }
    };
    let getData = {
        TableName: 'csye6225',
        Key: {
            'id': { S: data.Email }
        },
    };

    ddb.getItem(getData, function(err, data)
    {
        if(err) {
            console.log(err);
        }
        else {
            console.log(data);
            let jsonData = JSON.stringify(data);
            console.log(jsonData);
            let parsedJson = JSON.parse(jsonData);
            console.log(parsedJson);
            if (data.Item == null) {
                ddb.putItem(storeData, function(err, data) {
                    if(err) {
                        console.log(err);
                    } else{
                        const sendPromise = ses.sendEmail(emailParams).promise();
                        sendPromise
                            .then(data => {
                                console.log(data.Message);
                                callback.done(null, "Success");
                            })
                            .catch(err => {
                                console.error(err, err.stack);
                                callback.done(null, "Failed");
                            });
                    }
                });
            }
        }
    });
};