const aws = require("aws-sdk");
aws.config.update({ region: "us-east-1" });
const ses = new aws.SES();
exports.handler = function(event, context, callback) {
    console.log("AWS lambda and SES");
    console.log(event);
    const message = event.Records[0].Sns.Message;
    let data = JSON.parse(message);
    let currentTime = new Date().getTime();
    let ttl = 60 * 60 * 1000;
    let expirationTime = (currentTime + ttl).toString();
    console.log("Message -------------" +message);
    console.log("Data -------------" +data);
    console.log("Email -------------" +data.Email);
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
        Source: "webapp@"+process.env.DOMAINNAME
    };

    let ddb = new aws.DynamoDB({apiVersion: '2012-08-10'});
    let id  = data.Email + currentTime;
    let storeData = {
        TableName: "csye6225",
        Item: {
            id: id,
            email:{S: data.Email},
            data: { S:  message},
            ttl: { N: expirationTime }
        }
    };
    let getData = {
        TableName: 'csye6225',
        Key: {
            'data': { S: message }
        },
    };

    ddb.getItem(getData, function(err, data)
    {
        if(err) {
            console.log(err);
        }
        else {
            console.log("Get DATA---" + data);
            let jsonData = JSON.stringify(data);
            console.log("Get JSONDATA---" +jsonData);
            if (jsonData.Item == null) {
                ddb.putItem(storeData, function(err, data) {
                    if(err) {
                        console.log(err);
                    } else{
                        const sendPromise = ses.sendEmail(emailParams).promise();
                        sendPromise
                            .then(data => {
                                console.log("Added to DDB----- " + data.Message);
                                callback(null, "Success");
                            })
                            .catch(err => {
                                console.error(err, err.stack);
                                callback(null, "Failed");
                            });
                    }
                });
            } else {
                console.log("Email found. Donot send again");
            }
        }
    });
};