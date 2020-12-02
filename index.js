const aws = require("aws-sdk");
aws.config.update({ region: "us-east-1" });
const ses = new aws.SES();
exports.handler = function(event, context, callback) {
    const message = event.Records[0].Sns.Message;
    let publishedData = JSON.parse(message);
    console.log("Message -------------" +message);
    console.log("Data -------------" +publishedData);
    let ddb = new aws.DynamoDB({apiVersion: '2012-08-10'});
    let id  = "" + publishedData.Email + publishedData.Time;
    let getData = {
        TableName: 'csye6225',
        Key: {
            'id': { S: id}
        },
    };
    ddb.getItem(getData, function(error, data) {
        if(error) {
            console.log(error);
        }
        else {
            console.log("Get DATA---" + data);
            let jsonData = JSON.stringify(data);
            console.log("Get JSONDATA---" +jsonData);
            console.log("Get JSONDATA---" +data.Item);
            let dataItem = JSON.stringify(data.Item);
            console.log("Get dataItem---" +dataItem);
            if (data.Item === null || data.Item === undefined) {
                let storeData = {
                    TableName: "csye6225",
                    Item: {
                        id: {S: id},
                        data: { S: message}
                    }
                };
                ddb.putItem(storeData, function(error, data) {
                    if(error) {
                        console.log(error);
                    } else{
                        let emailParams = {
                            Destination: {
                                ToAddresses: [
                                    publishedData.Email
                                ]
                            },
                            Message: {
                                Body: {
                                    Text: {
                                        Charset: "UTF-8",
                                        Data: publishedData.Message
                                    }
                                },
                                Subject: {
                                    Charset: "UTF-8",
                                    Data:publishedData.Subject
                                }
                            },
                            Source: "webapp@"+process.env.DOMAINNAME
                        };
                        const sendPromise = ses.sendEmail(emailParams).promise();
                        sendPromise
                            .then(data => {
                                console.log("Added to DDB----- " + data.Message);
                                callback(null, "Success");
                            })
                            .catch(error => {
                                console.error(error, error.stack);
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