const aws = require("aws-sdk");
aws.config.update({ region: "us-east-1" });
const ses = new aws.SES();
exports.handler = function(event, context, callback) {
    console.log("AWS lambda and SES");
    console.log(event);
    const message = event.Records[0].Sns.Message;
    let messageJson = JSON.parse(message);
    let data = JSON.parse(messageJson.data);
    console.log(message);
    console.log(data);
    console.log(data.email);
    console.log(data.count);
    let emailParams = {
        Destination: {
            ToAddresses: [
                data.email
            ]
        },
        Message: {
            Body: {
                Text: {
                    Charset: "UTF-8",
                    Data: "Data: "+ data
                }
            },
            Subject: {
                Charset: "UTF-8",
                Data: "Test"
            }
        },
        Source: "csye6225@dev.aashok.me"
    };
    // Create the promise and SES service object
    const sendPromise = ses.sendEmail(emailParams).promise();
    sendPromise
        .then(data => {
            console.log(data.MessageId);
            callback.done(null, "Success");
        })
        .catch(err => {
            console.error(err, err.stack);
            callback.done(null, "Failed");
        });
};