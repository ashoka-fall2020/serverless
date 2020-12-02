const aws = require("aws-sdk");
aws.config.update({ region: "us-east-1" });
const ses = new aws.SES();
exports.handler = function(event, context, callback) {
    const message = event.Records[0].Sns.Message;
    let data = JSON.parse(message);
    console.log("Message -------------" +message);
    console.log("Data -------------" +data);
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
                    Data: data.Message
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
    let id  = "" + data.Email + data.Time;
    let storeData = {
        TableName: "csye6225",
        Item: {
            id: {S: id},
            data: { S: message}
        }
    };
    let getData = {
        TableName: 'csye6225',
        Key: {
            'id': { S: id}
        },
    };

    ddb.getItem(getData, function(err, data) {
        if(err) {
            console.log(err);
        }
        else {
            console.log("Get DATA---" + data);
            let jsonData = JSON.stringify(data);
            console.log("Get JSONDATA---" +jsonData);
            console.log("Get JSONDATA---" +data.Item);
            let dataItem = JSON.stringify(data.Item);
            console.log("Get dataItem---" +dataItem);
            if (data.Item === null || data.Item === undefined) {
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
                console.log("Email found. Do not send again");
            }
        }
    });
};